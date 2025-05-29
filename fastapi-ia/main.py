from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from typing import List, Optional
from transformers import T5ForConditionalGeneration, T5Tokenizer
import pandas as pd
from sqlalchemy import create_engine
import logging
from datetime import datetime
import os
import re

# Configuration du logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialisation de l'application FastAPI
app = FastAPI(title="Project Management AI API")

# Middleware pour logger les requêtes
@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        body = await request.body()
        logger.debug(f"Requête reçue : {request.url.path} {body.decode('utf-8', errors='ignore')}")
    except Exception as e:
        logger.error(f"Erreur lors du log de la requête : {e}")
    response = await call_next(request)
    return response

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèles Pydantic pour la validation
class Societe(BaseModel):
    raisonSociale: Optional[str] = None

class StatutProjet(BaseModel):
    nom: Optional[str] = None

class Project(BaseModel):
    id: int
    nomProjet: str
    dateDebut: Optional[str] = None
    dateFin: Optional[str] = None
    statutProjet: Optional[StatutProjet] = None
    budget: Optional[float] = 0.0
    archived: Optional[bool] = False
    societe: Optional[Societe] = None
    equipe_id: Optional[int] = None

class Task(BaseModel):
    id: int
    idProjet: int
    dateDebut: Optional[str] = None
    dateFin: Optional[str] = None
    idStatutTache: Optional[int] = None
    assigne: Optional[str] = None
    titre: Optional[str] = None

class Agent(BaseModel):
    id: Optional[int] = None
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[str] = None

class Equipe(BaseModel):
    id: Optional[int] = None
    nom: Optional[str] = None
    responsable_id: Optional[int] = None

class AnalysisRequest(BaseModel):
    query: str
    projects: List[Project]
    tasks: List[Task]
    agents: Optional[List[Agent]] = []
    equipes: Optional[List[Equipe]] = []
    filterPeriod: str
    language: str = "fr"

class SuggestQuestionsRequest(BaseModel):
    projects: List[Project]
    tasks: List[Task]
    agents: Optional[List[Agent]] = []
    equipes: Optional[List[Equipe]] = []
    language: str = "fr"

# Connexion à la base de données
def connect_db():
    try:
        engine = create_engine(
            "mssql+pyodbc://yousef_SQLLogin_3:ffgox4f8th@helpdesk.mssql.somee.com:1433/helpdesk"
            "?driver=ODBC+Driver+17+for+SQL+Server&Encrypt=yes&TrustServerCertificate=yes"
        )
        logger.info("Connexion à la base de données réussie.")
        return engine
    except Exception as e:
        logger.error(f"Erreur de connexion à la base de données : {e}")
        raise Exception("Échec de la connexion à la base de données")

# Extraction des données
def extract_data():
    engine = connect_db()
    try:
        projects_df = pd.read_sql("SELECT * FROM projet", engine)
        tasks_df = pd.read_sql("SELECT * FROM tache_projet", engine)
        agents_df = pd.read_sql("SELECT * FROM agent", engine)
        equipes_df = pd.read_sql("SELECT * FROM equipe", engine)
        try:
            statut_projet_df = pd.read_sql("SELECT * FROM statut_projet", engine)
        except:
            statut_projet_df = pd.DataFrame()
        try:
            statut_tache_df = pd.read_sql("SELECT * FROM statut_tache", engine)
        except:
            statut_tache_df = pd.DataFrame()
        try:
            societe_df = pd.read_sql("SELECT * FROM societe", engine)
            logger.info(f"Colonnes de 'societe': {societe_df.columns.tolist()}")
        except:
            societe_df = pd.DataFrame()
        logger.info(f"Données extraites : {len(projects_df)} projets, {len(tasks_df)} tâches, {len(agents_df)} agents, {len(equipes_df)} équipes")
        return projects_df, tasks_df, agents_df, equipes_df, statut_projet_df, statut_tache_df, societe_df
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction des données : {e}")
        raise

# Conversion des données du frontend vers le format interne
def normalize_project(project: Project):
    return {
        "id": project.id,
        "nom_projet": project.nomProjet,
        "date_debut": project.dateDebut,
        "date_fin": project.dateFin,
        "statut_id": project.statutProjet.nom if project.statutProjet else None,
        "budget": project.budget,
        "archived": project.archived,
        "societe_id": project.societe.raisonSociale if project.societe else None,
        "equipe_id": project.equipe_id
    }

def normalize_task(task: Task):
    return {
        "id": task.id,
        "id_projet": task.idProjet,
        "date_debut": task.dateDebut,
        "date_fin": task.dateFin,
        "id_statut_tache": task.idStatutTache,
        "assigne": task.assigne,
        "titre": task.titre
    }

# Chargement du modèle
model_path = "./models/fine_tuned_t5"
try:
    if not os.path.exists(model_path):
        logger.warning(f"Le dossier du modèle fine-tuné {model_path} n'existe pas. Utilisation de google/flan-t5-base.")
    tokenizer = T5Tokenizer.from_pretrained(
        model_path if os.path.exists(model_path) else "google/flan-t5-base",
        legacy=True
    )
    model = T5ForConditionalGeneration.from_pretrained(
        model_path if os.path.exists(model_path) else "google/flan-t5-base"
    )
    logger.info(f"Modèle chargé depuis : {'fine_tuned_t5' if os.path.exists(model_path) else 'google/flan-t5-base'}")
except Exception as e:
    logger.error(f"Erreur lors du chargement du modèle : {e}")
    raise

@app.post("/api/ai/analyze")
async def analyze(request: AnalysisRequest):
    try:
        query = request.query.lower().strip()
        logger.debug(f"Query reçue : {query}")
        projects = [normalize_project(p) for p in request.projects]
        tasks = [normalize_task(t) for t in request.tasks]
        agents = request.agents or []
        equipes = request.equipes or []
        filterPeriod = request.filterPeriod
        language = request.language

        # Forcer la langue à 'fr'
        if language != "fr":
            logger.warning(f"Langue incorrecte reçue : {language}. Forcé à 'fr'.")
            language = "fr"

        current_date = datetime.now().strftime("%Y-%m-%d")

        # Extraire les données de la base pour enrichir le contexte
        projects_df, tasks_df, agents_df, equipes_df, statut_projet_df, statut_tache_df, societe_df = extract_data()

        # Préparer le contexte
        delayed_projects = [
            p for p in projects
            if p["date_fin"] and p["statut_id"] != "Terminé" and p["date_fin"] < current_date
        ]
        completed_projects = [p for p in projects if p["statut_id"] == "Terminé"]
        delayed_tasks = [
            t for t in tasks
            if t["date_fin"] and t["id_statut_tache"] != 3 and t["date_fin"] < current_date
        ]
        task_count_by_project = {}
        for task in tasks:
            task_count_by_project[task["id_projet"]] = task_count_by_project.get(task["id_projet"], 0) + 1
        projects_with_tasks = [
            {"nom_projet": p["nom_projet"], "task_count": task_count_by_project.get(p["id"], 0)}
            for p in projects
        ]
        projects_with_tasks.sort(key=lambda x: x["task_count"], reverse=True)

        # Informations sur les équipes et agents
        equipe_info = ", ".join(f"{e['nom']} (Responsable ID: {e['responsable_id']})" for e in equipes) if equipes else "Aucune"
        agent_info = ", ".join(f"{a['prenom']} {a['nom']}" for a in agents) if agents else "Aucun"

        # Contexte général de gestion de projet
        general_context = (
            "Contexte général : Gestion de projet avec méthodologies Agile (itérations courtes, collaboration client) "
            "et Waterfall (planification linéaire). Importance de la communication, gestion des risques, motivation des équipes, et suivi des jalons."
        )

        # Formatter les projets avec le plus de tâches
        top_projects = [
            f"{p['nom_projet']} ({p['task_count']} tâches)"
            for p in projects_with_tasks[:3]
        ]
        top_projects_str = ", ".join(top_projects) if top_projects else "Aucun"

        context = (
            f"{general_context}\n"
            f"Date actuelle : {current_date}\n"
            f"Période de filtre : {filterPeriod}\n"
            f"Total des projets : {len(projects)}\n"
            f"Projets actifs : {sum(1 for p in projects if not p['archived'])}\n"
            f"Projets terminés : {len(completed_projects)}\n"
            f"Projets en retard : {len(delayed_projects)}\n"
            f"Total des tâches : {len(tasks)}\n"
            f"Tâches en retard : {len(delayed_tasks)}\n"
            f"Équipes : {equipe_info}\n"
            f"Agents : {agent_info}\n"
            f"Projets avec le plus de tâches : {top_projects_str}\n"
            f"Budget total : {sum(p['budget'] for p in projects):.2f} $\n"
            f"Total des équipes : {len(equipes_df)} équipes actives\n"
        )

        # Règles spécifiques
        # 1. Comment motiver l'équipe du projet
        motivate_team_match = re.search(
            r"comment\s+(?:motiver|encourager)\s+(?:l'équipe|l equipe|les\s+agents)\s*(?:du\s+projet|pour\s+le\s+projet)\s+([\w\s\-\.]+?)(?:\s*\?|$)",
            query,
            re.IGNORECASE
        )
        if motivate_team_match:
            project_name = motivate_team_match.group(1).strip()
            for project in projects:
                if project["nom_projet"].lower() == project_name.lower():
                    response = (
                        f"Pour motiver l'équipe du projet {project['nom_projet']}, organisez des réunions régulières, "
                        "reconnaissez leurs efforts, fixez des objectifs clairs, et encouragez la collaboration."
                    )
                    return {
                        "response": response,
                        "structured_data": {
                            "project_name": project["nom_projet"],
                            "type": "text",
                            "response": response
                        }
                    }
            return {
                "response": f"Aucun projet nommé '{project_name}' trouvé.",
                "structured_data": None
            }

        # 2. Comment gérer les retards du projet
        manage_delays_match = re.search(
            r"comment\s+(?:gérer|gerer|résoudre|resoudre)\s+(?:les\s+)?retards?\s*(?:du\s+projet|pour\s+le\s+projet)\s+([\w\s\-\.]+?)(?:\s*\?|$)",
            query,
            re.IGNORECASE
        )
        if manage_delays_match:
            project_name = manage_delays_match.group(1).strip()
            for project in projects:
                if project["nom_projet"].lower() == project_name.lower():
                    response = (
                        f"Pour gérer les retards du projet {project['nom_projet']}, priorisez les tâches critiques, "
                        "augmentez la communication avec l'équipe, réallouez les ressources si nécessaire, et utilisez des outils de suivi comme Trello."
                    )
                    return {
                        "response": response,
                        "structured_data": {
                            "project_name": project["nom_projet"],
                            "type": "text",
                            "response": response
                        }
                    }
            return {
                "response": f"Aucun projet nommé '{project_name}' trouvé.",
                "structured_data": None
            }

        # 3. Comment motiver les agents
        if re.search(r"comment\s+(?:motiver|encourager)\s+(?:les\s+)?agents(?:\s*\?|$)", query, re.IGNORECASE):
            response = (
                "Pour motiver les agents, organisez des réunions régulières, reconnaissez leurs efforts, "
                "fixez des objectifs clairs, et offrez des opportunités de développement professionnel."
            )
            return {
                "response": response,
                "structured_data": {
                    "type": "text",
                    "response": response
                }
            }

        # 4. Nombre de tâches par projet
        task_count_match = re.search(
            r"combien\s+(?:de\s+)?(?:tâches|taches)\s*(?:sont\s+)?(?:associées?\s*(?:à|a)|pour)?\s*(?:le\s+)?projet\s+([\w\s\-\.]+?)(?:\s*\?|$)",
            query,
            re.IGNORECASE
        )
        if task_count_match:
            project_name = task_count_match.group(1).strip()
            for project in projects_with_tasks:
                if project["nom_projet"].lower() == project_name.lower():
                    response = f"Le projet {project['nom_projet']} a {project['task_count']} tâche(s)."
                    logger.info(f"Réponse directe : {response}")
                    return {
                        "response": response,
                        "structured_data": {
                            "project_name": project["nom_projet"],
                            "task_count": project["task_count"],
                            "type": "task_count"
                        }
                    }
            return {
                "response": f"Aucun projet nommé '{project_name}' trouvé.",
                "structured_data": None
            }

        # 5. Budget total
        if "budget total" in query and not re.search(r"pour\s+(?:le\s+)?projet", query):
            total_budget = sum(p["budget"] for p in projects)
            response = f"Le budget total des projets est de {total_budget:.2f} $."
            return {
                "response": response,
                "structured_data": {
                    "total_budget": total_budget,
                    "type": "budget"
                }
            }

        # 6. Budget d'un projet
        budget_project_match = re.search(
            r"budget\s+(?:total\s+)?pour\s+(?:le\s+)?projet\s+([\w\s]+?)(?:\s*\?|$)",
            query
        )
        if budget_project_match:
            project_name = budget_project_match.group(1).strip()
            for project in projects:
                if project["nom_projet"].lower() == project_name.lower():
                    response = f"Le budget du projet {project['nom_projet']} est de {project['budget']:.2f} $."
                    return {
                        "response": response,
                        "structured_data": {
                            "project_name": project["nom_projet"],
                            "budget": project["budget"],
                            "type": "project_budget"
                        }
                    }
            return {
                "response": f"Aucun projet nommé '{project_name}' trouvé.",
                "structured_data": None
            }

        # 7. Projets en retard
        if "projets en retard" in query:
            response = f"Il y a {len(delayed_projects)} projet(s) en retard."
            return {
                "response": response,
                "structured_data": {
                    "delayed_projects": len(delayed_projects),
                    "project_names": [p["nom_projet"] for p in delayed_projects],
                    "type": "bar"
                }
            }

        # 8. Tâches en retard
        if "tâches en retard" in query or "taches en retard" in query:
            response = f"Il y a {len(delayed_tasks)} tâche(s) en retard."
            return {
                "response": response,
                "structured_data": {
                    "delayed_tasks": len(delayed_tasks),
                    "type": "task_count"
                }
            }

        # 9. Nombre total d'équipes
        if "nombre total des equipes" in query or "nombre d'équipes" in query:
            equipe_count = len(equipes_df)
            response = f"Il y a {equipe_count} équipe(s) active(s)."
            return {
                "response": response,
                "structured_data": {
                    "equipe_count": equipe_count,
                    "type": "count"
                }
            }

        # 10. Questions générales sur la gestion de projet
        if "principes agile" in query:
            response = "Les principes Agile incluent des itérations courtes, une collaboration étroite avec le client, et une livraison continue."
            return {"response": response, "structured_data": {"type": "text"}}

        # 11. Améliorer la productivité
        if "améliorer la productivité" in query or "productivité d'une équipe" in query:
            response = (
                "Pour améliorer la productivité d'une équipe sur un projet en retard, planifiez des sprints courts, "
                "utilisez des outils de suivi comme Trello, et motivez l'équipe avec des objectifs clairs."
            )
            return {"response": response, "structured_data": {"type": "text"}}

        # Préparer l'entrée pour T5
        input_text = (
            f"Langue : {language}\n"
            f"Contexte : {context}\n"
            f"Question : {query}\n"
            f"Instruction : Répondez en une phrase concise en français, en évitant les réponses vides ou incohérentes."
        )

        try:
            inputs = tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True)
            outputs = model.generate(
                **inputs,
                max_length=150,
                num_return_sequences=1,
                no_repeat_ngram_size=2,
                num_beams=5,
            )
            response = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
            logger.info(f"Réponse brute de T5 : {response}")
        except Exception as e:
            logger.error(f"Erreur lors de la génération T5 : {e}")
            response = "Erreur lors de la génération de la réponse."

        # Post-traitement des réponses
        if not response or response.lower() in ["aucune réponse disponible", "", "unknown"]:
            response = "Désolé, je n'ai pas pu générer une réponse précise pour cette question. Essayez de reformuler."
        elif re.match(r"^(d\)\s*:\s*)+d\)$", response):
            logger.error(f"Réponse mal formée détectée : {response}")
            response = "Erreur : Réponse invalide. Essayez de reformuler la question."

        structured_data = None
        if "projets terminés" in query:
            structured_data = {
                "completed_projects": len(completed_projects),
                "project_names": [p["nom_projet"] for p in completed_projects],
                "type": "list"
            }

        logger.info(f"Requête : {query}, Réponse : {response}")
        return {"response": response, "structured_data": structured_data}
    except ValidationError as e:
        logger.error(f"Erreur de validation dans /api/ai/analyze : {e.errors()}")
        raise HTTPException(status_code=422, detail=f"Erreur de validation : {e.errors()}")
    except Exception as e:
        logger.error(f"Erreur dans l'analyse : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse : {str(e)}")

@app.post("/api/ai/suggest-questions")
async def suggest_questions(request: SuggestQuestionsRequest):
    try:
        projects = [normalize_project(p) for p in request.projects]
        tasks = [normalize_task(t) for t in request.tasks]
        agents = request.agents or []
        equipes = request.equipes or []
        language = request.language

        if language != "fr":
            logger.warning(f"Langue incorrecte reçue : {language}. Forcé à 'fr'.")
            language = "fr"

        current_date = datetime.now().strftime("%Y-%m-%d")

        # Préparer le contexte
        delayed_projects = [
            p for p in projects
            if p["date_fin"] and p["statut_id"] != "Terminé" and p["date_fin"] < current_date
        ]
        completed_projects = [p for p in projects if p["statut_id"] == "Terminé"]
        delayed_tasks = [
            t for t in tasks
            if t["date_fin"] and t["id_statut_tache"] != 3 and t["date_fin"] < current_date
        ]

        context = (
            f"Date actuelle : {current_date}\n"
            f"Total des projets : {len(projects)}\n"
            f"Projets terminés : {len(completed_projects)}\n"
            f"Projets en retard : {len(delayed_projects)}\n"
            f"Total des tâches : {len(tasks)}\n"
            f"Tâches en retard : {len(delayed_tasks)}\n"
            f"Total des agents : {len(agents)}\n"
            f"Total des équipes : {len(equipes)}\n"
        )

        input_text = (
            f"Langue : {language}\n"
            f"Contexte : {context}\n"
            f"Générez 5 questions pertinentes sur la gestion de projets, tâches, agents et équipes, basées sur le contexte. "
            f"Incluez des questions comme 'Comment motiver l'équipe du projet X ?', 'Comment gérer les retards du projet X ?', et 'Comment motiver les agents ?'. "
            f"Chaque question doit être concise et sur une ligne."
        )

        inputs = tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True)
        outputs = model.generate(
            **inputs,
            max_length=250,
            num_return_sequences=1,
            no_repeat_ngram_size=2,
            num_beams=4
        )
        response = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

        suggested_questions = [q.strip() for q in response.split("\n") if q.strip()]
        # Ajouter des questions spécifiques
        project_specific_questions = []
        for project in projects:
            project_specific_questions.extend([
                f"Comment motiver l'équipe du projet {project['nom_projet']} ?",
                f"Comment gérer les retards du projet {project['nom_projet']} ?"
            ])
        suggested_questions = list(set(suggested_questions + project_specific_questions + ["Comment motiver les agents ?"]))
        suggested_questions = suggested_questions[:10]  # Limiter à 10 questions

        logger.info(f"Questions suggérées générées : {suggested_questions}")
        return {"questions": suggested_questions}
    except ValidationError as e:
        logger.error(f"Erreur de validation dans /api/ai/suggest-questions : {e.errors()}")
        raise HTTPException(status_code=422, detail=f"Erreur de validation : {e.errors()}")
    except Exception as e:
        logger.error(f"Erreur lors de la génération des questions : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération : {str(e)}")

@app.get("/api/projects")
async def get_projects(useAI: Optional[bool] = False):
    try:
        projects_df, tasks_df, _, _, _, _, societe_df = extract_data()
        projects = []
        for _, project in projects_df.iterrows():
            task_count = len(tasks_df[tasks_df["id_projet"] == project["id"]])
            if useAI and task_count == 0:
                continue
            societe_name = None
            if "societe_id" in project and project["societe_id"] and not societe_df.empty:
                societe_columns = societe_df.columns.tolist()
                for col in ["raisonSociale", "nom", "name", "raison_sociale"]:
                    if col in societe_columns:
                        societe_name = societe_df[societe_df["id"] == project["societe_id"]][col].iloc[0] if project["societe_id"] in societe_df["id"].values else None
                        break
            projects.append({
                "id": project["id"],
                "nomProjet": project["nom_projet"],
                "dateDebut": str(project.get("date_debut", None)) if project.get("date_debut") else None,
                "dateFin": str(project.get("date_fin", None)) if project.get("date_fin") else None,
                "statutProjet": {"nom": project.get("statut_id", "Inconnu")},
                "budget": project.get("budget", 0.0),
                "archived": project.get("archived", False),
                "societe": {"raisonSociale": societe_name},
                "equipe_id": project.get("equipe_id", None)
            })
        logger.info(f"Projets renvoyés : {len(projects)}")
        return projects
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des projets : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des projets : {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)