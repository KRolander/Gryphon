import axios from "axios";

// Create a new axios instance
export default () => {
    return axios.create({
        baseURL: 'http://localhost:3000/'
    })
}