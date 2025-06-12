import axios from "axios";
import { APIUrl } from "./strore";

export const getDownloadData = (listids, filters) => {
  return axios
    .post(
      `${APIUrl}/download/`,
      {
        id: listids ? listids.map((d) => d.event_ma_id) : undefined,
        filters,
      },
      {
        responseType: "blob", // 🔥 this is important for file
      }
    )
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "export.csv"); // or any filename
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch((err) => {
      console.error("Download failed", err);
    });
};
