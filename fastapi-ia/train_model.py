import pandas as pd
from transformers import T5ForConditionalGeneration, T5Tokenizer, Trainer, TrainingArguments, TrainerCallback
from datasets import Dataset
import logging
import os
from datetime import datetime
import glob
import gc

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logging.getLogger("urllib3").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# Callback pour suivre la progression
class LogCallback(TrainerCallback):
    def on_step_end(self, args, state, control, **kwargs):
        logger.info(f"Iteration {state.global_step}/{state.max_steps} terminée")
        gc.collect()
    def on_train_begin(self, args, state, control, **kwargs):
        logger.info("Début de l'entraînement du modèle")
    def on_train_end(self, args, state, control, **kwargs):
        logger.info("Fin de l'entraînement du modèle")

# Extraction des données à partir de fichiers CSV
def extract_data():
    try:
        data_dir = "./data"  # Remplacez par le chemin de vos fichiers CSV
        projects_df = pd.read_csv(os.path.join(data_dir, "projet.csv"))
        tasks_df = pd.read_csv(os.path.join(data_dir, "tache_projet.csv"))
        agents_df = pd.read_csv(os.path.join(data_dir, "agent.csv"))
        equipes_df = pd.read_csv(os.path.join(data_dir, "equipe.csv"))
        statut_projet_df = pd.read_csv(os.path.join(data_dir, "statut_projet.csv")) if os.path.exists(os.path.join(data_dir, "statut_projet.csv")) else pd.DataFrame()
        statut_tache_df = pd.read_csv(os.path.join(data_dir, "statut_tache.csv")) if os.path.exists(os.path.join(data_dir, "statut_tache.csv")) else pd.DataFrame()
        societe_df = pd.read_csv(os.path.join(data_dir, "societe.csv")) if os.path.exists(os.path.join(data_dir, "societe.csv")) else pd.DataFrame()
        logger.info(f"Données extraites : {len(projects_df)} projets, {len(tasks_df)} tâches, {len(agents_df)} agents, {len(equipes_df)} équipes")
        return projects_df, tasks_df, agents_df, equipes_df, statut_projet_df, statut_tache_df, societe_df
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction des données : {e}")
        raise

# Préparation du jeu de données pour l'entraînement
def prepare_dataset(projects_df, tasks_df, agents_df, equipes_df, statut_projet_df, statut_tache_df, societe_df):
    data = []
    current_date = pd.Timestamp(datetime.today())

    project_columns = projects_df.columns.tolist()
    task_columns = tasks_df.columns.tolist()
    agent_columns = agents_df.columns.tolist()
    equipe_columns = equipes_df.columns.tolist()
    logger.info(f"Colonnes de 'projet': {project_columns}")
    logger.info(f"Colonnes de 'tache_projet': {task_columns}")
    logger.info(f"Colonnes de 'agent': {agent_columns}")
    logger.info(f"Colonnes de 'equipe': {equipe_columns}")

    for _, project in projects_df.iterrows():
        project_tasks = tasks_df[tasks_df["id_projet"] == project["id"]].copy()
        task_count = len(project_tasks)
        delayed_tasks = 0
        if "date_fin" in task_columns and "id_statut_tache" in task_columns:
            project_tasks["date_fin"] = pd.to_datetime(project_tasks["date_fin"], errors='coerce')
            delayed_tasks = len(project_tasks[
                (project_tasks["date_fin"].notnull()) &
                (project_tasks["id_statut_tache"] != 3) &
                (project_tasks["date_fin"] < current_date)
            ])
        statut_projet = project.get("statut_id", "Inconnu")
        if not statut_projet_df.empty and "id" in statut_projet_df.columns:
            statut_name = statut_projet_df[statut_projet_df["id"] == statut_projet]["nom"].iloc[0] if statut_projet in statut_projet_df["id"].values else "Inconnu"
        else:
            statut_name = statut_projet

        equipe_count = 0
        equipe_name = "Aucune"
        if "equipe_id" in project_columns and project.get("equipe_id"):
            equipe_count = 1
            equipe_name = equipes_df[equipes_df["id"] == project["equipe_id"]]["nom"].iloc[0] if project["equipe_id"] in equipes_df["id"].values else "Inconnue"

        agents_count = 0
        agent_names = []
        if "assigne" in task_columns:
            assignees = project_tasks["assigne"].dropna().unique()
            for assignee in assignees:
                agent_id = assignee if isinstance(assignee, int) else None
                if agent_id and agent_id in agents_df["id"].values:
                    agent_name = f"{agents_df[agents_df['id'] == agent_id]['prenom'].iloc[0]} {agents_df[agents_df['id'] == agent_id]['nom'].iloc[0]}"
                    agent_names.append(agent_name)
            agents_count = len(agent_names)

        societe_name = "Aucune"
        if "societe_id" in project_columns and project.get("societe_id") and not societe_df.empty:
            societe_columns = societe_df.columns.tolist()
            for col in ["raisonSociale", "nom", "name", "raison_sociale", "nom_societe"]:
                if col in societe_columns:
                    societe_name = societe_df[societe_df["id"] == project["societe_id"]][col].iloc[0] if project["societe_id"] in societe_df["id"].values else "Inconnue"
                    break
            else:
                logger.warning(f"Aucune colonne de nom trouvée dans 'societe'. Colonnes disponibles : {societe_columns}")
                societe_name = "Inconnue"

        context = (
            f"Projet : {project['nom_projet']}, "
            f"Statut : {statut_name}, "
            f"Budget : {project.get('budget', 0.0):.2f}, "
            f"Dates : {project.get('date_debut', 'N/A')} à {project.get('date_fin', 'N/A')}, "
            f"Tâches : {task_count}, "
            f"Tâches en retard : {delayed_tasks}, "
            f"Équipe : {equipe_name}, "
            f"Agents : {', '.join(agent_names) if agent_names else 'Aucun'}, "
            f"Société : {societe_name}"
        )
        questions = [
            f"Quel est le statut du projet {project['nom_projet']} ?",
            f"Combien de tâches sont associées au projet {project['nom_projet']} ?",
            f"Combien de tâches sont en retard pour {project['nom_projet']} ?",
            f"Quel est le budget du projet {project['nom_projet']} ?",
            f"Quelle équipe est assignée au projet {project['nom_projet']} ?",
            f"Quels agents travaillent sur {project['nom_projet']} ?",
            f"Quelle est la société associée au projet {project['nom_projet']} ?",
            f"Comment motiver l'équipe du projet {project['nom_projet']} ?",
            f"Comment gérer les retards du projet {project['nom_projet']} ?"
        ]
        answers = [
            statut_name,
            str(task_count),
            str(delayed_tasks),
            f"{project.get('budget', 0.0):.2f} $",
            equipe_name,
            ", ".join(agent_names) if agent_names else "Aucun",
            societe_name,
            f"Pour motiver l'équipe du projet {project['nom_projet']}, organisez des réunions régulières, reconnaissez leurs efforts, fixez des objectifs clairs, et encouragez la collaboration.",
            f"Pour gérer les retards du projet {project['nom_projet']}, priorisez les tâches critiques, augmentez la communication avec l'équipe, réallouez les ressources si nécessaire, et utilisez des outils de suivi comme Trello."
        ]
        for q, a in zip(questions, answers):
            data.append({"context": context, "question": q, "answer": a})

    total_budget = projects_df["budget"].sum() if "budget" in project_columns else 0.0
    delayed_projects = len(projects_df[
        (pd.to_datetime(projects_df["date_fin"], errors="coerce") < current_date) &
        (projects_df["statut_id"] != "Terminé")
    ]) if "date_fin" in project_columns else 0
    completed_tasks = len(tasks_df[tasks_df["id_statut_tache"] == 3]) if "id_statut_tache" in task_columns else 0
    delayed_tasks = len(tasks_df[
        (pd.to_datetime(tasks_df["date_fin"], errors="coerce") < current_date) &
        (tasks_df["id_statut_tache"] != 3)
    ]) if "id_statut_tache" in task_columns else 0

    global_context = (
        f"Total des projets : {len(projects_df)}, "
        f"Projets en retard : {delayed_projects}, "
        f"Budget total : {total_budget:.2f}, "
        f"Total des tâches : {len(tasks_df)}, "
        f"Tâches terminées : {completed_tasks}, "
        f"Tâches en retard : {delayed_tasks}, "
        f"Total des agents : {len(agents_df)}, "
        f"Total des équipes : {len(equipes_df)}, "
        f"Contexte général : Gestion de projet avec méthodologies Agile et Waterfall, importance de la communication, de la planification, et de la motivation des équipes."
    )
    global_questions = [
        "Quel est le budget total des projets ?",
        "Combien de projets sont en retard ?",
        "Combien de tâches sont terminées ?",
        "Combien de tâches sont en retard ?",
        "Quels sont les principes de la gestion Agile ?",
        "Comment gérer les retards dans un projet ?",
        "Combien d'agents sont impliqués dans tous les projets ?",
        "Combien d'équipes sont actives ?",
        "Comment motiver les agents ?",
        "Comment améliorer la productivité d'une équipe sur un projet en retard ?",
        "Quelles sont les meilleures pratiques pour gérer plusieurs projets simultanément ?",
        "Comment réduire les risques dans un projet ?",
        "Comment assurer une bonne communication dans une équipe projet ?"
    ]
    global_answers = [
        f"{total_budget:.2f} $",
        str(delayed_projects),
        str(completed_tasks),
        str(delayed_tasks),
        "Itérations courtes, collaboration avec le client, livraison continue.",
        "Prioriser les tâches critiques, augmenter la communication, réallouer les ressources.",
        str(len(agents_df[agents_df["id"].isin(tasks_df["assigne"].dropna().unique())])),
        str(len(equipes_df)),
        "Organiser des réunions régulières, reconnaître les efforts, et fixer des objectifs clairs.",
        "Planifier des sprints courts, utiliser des outils de suivi, et motiver l'équipe avec des objectifs clairs.",
        "Utiliser des outils de gestion comme Trello, prioriser les tâches, et déléguer efficacement.",
        "Identifier les risques tôt, élaborer des plans de contingence, et surveiller les jalons.",
        "Organiser des réunions quotidiennes, utiliser des canaux comme Slack, et encourager la transparence."
    ]
    for q, a in zip(global_questions, global_answers):
        data.append({"context": global_context, "question": q, "answer": a})

    dataset = Dataset.from_dict({
        "context": [d["context"] for d in data],
        "question": [d["question"] for d in data],
        "answer": [d["answer"] for d in data]
    })
    return dataset

# Tokenisation des données
def tokenize_function(examples):
    tokenizer = T5Tokenizer.from_pretrained("google/flan-t5-base", legacy=True)
    inputs = [f"Contexte : {c}\nQuestion : {q}" for c, q in zip(examples["context"], examples["question"])]
    model_inputs = tokenizer(inputs, max_length=512, truncation=True, padding="max_length")
    labels = tokenizer(examples["answer"], max_length=128, truncation=True, padding="max_length")
    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

# Entraînement du modèle
def train_model():
    try:
        projects_df, tasks_df, agents_df, equipes_df, statut_projet_df, statut_tache_df, societe_df = extract_data()
        dataset = prepare_dataset(projects_df, tasks_df, agents_df, equipes_df, statut_projet_df, statut_tache_df, societe_df)
        tokenizer = T5Tokenizer.from_pretrained("google/flan-t5-base", legacy=True)
        logger.info("Début de la tokenisation du jeu de données")
        tokenized_dataset = dataset.map(tokenize_function, batched=True)
        logger.info("Tokenisation terminée")

        logger.info("Chargement du modèle")
        model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base")
        training_args = TrainingArguments(
            output_dir="./models",
            num_train_epochs=3,
            per_device_train_batch_size=1,
            gradient_accumulation_steps=2,
            save_steps=25,
            save_total_limit=2,
            logging_dir="./logs",
            logging_steps=10,
            use_cpu=True,
            fp16=False,
        )

        # Vérifier les checkpoints existants
        checkpoint = None
        checkpoint_dirs = glob.glob("./models/checkpoint-*")
        if checkpoint_dirs:
            for dir in sorted(checkpoint_dirs, key=os.path.getmtime, reverse=True):
                if os.path.exists(os.path.join(dir, "pytorch_model.bin")):
                    checkpoint = dir
                    logger.info(f"Checkpoint valide trouvé : {checkpoint}")
                    break
            else:
                logger.warning("Aucun checkpoint valide trouvé. Suppression des checkpoints corrompus et démarrage à zéro.")
                for dir in checkpoint_dirs:
                    import shutil
                    shutil.rmtree(dir, ignore_errors=True)

        logger.info("Initialisation du Trainer")
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=tokenized_dataset,
            callbacks=[LogCallback()],
        )

        logger.info("Début de l'entraînement")
        trainer.train(resume_from_checkpoint=checkpoint)
        logger.info("Entraînement terminé")

        model.save_pretrained("./models/fine_tuned_t5")
        tokenizer.save_pretrained("./models/fine_tuned_t5")
        logger.info("Modèle fine-tuné sauvegardé.")
    except Exception as e:
        logger.error(f"Erreur critique pendant l'entraînement : {e}", exc_info=True)
        raise

if __name__ == "__main__":
    train_model()