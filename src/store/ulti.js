import { APIUrl } from "./strore";

export const getDownloadData = (listids) => {
  return axios
    .post(`${APIUrl}/meta/`, {
      id: listids.map((d) => d._id),
      download: true,
    })
    .then(({ data }) => {
      return data;
    });
};
