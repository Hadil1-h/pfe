import axios from "axios";

const base = "http://localhost:8080/api/url";


export const getAllTicket = async()=>{
    try {
        const rep = await axios.get(`${base}`);
         return rep.data;
    } catch(error){
        console.error("erreud dans la recuperation des ticket ",error);

    }
};
export const getTicketById = async(id)=>{
    try {
        const rep = await axios.get(`${base}/${id}`);
         return rep.data;
    } catch(error){
        console.error("erreud dans la recuperation des ticket ",error); 

    }    
};
export const createTicket = async (ticket) => {
    try {
      const rep = await axios.post(`${base}`, ticket);
      return rep.data;
    } catch (error) {
      console.error("error creating ticket", error);
    }
  };