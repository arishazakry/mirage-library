import { APIUrl } from "./strore";

export const getDownloadData = (listids, filters) => {
  return axios
    .post(`${APIUrl}/download/`, {
      id: listids ? listids.map((d) => d.event_ma_id) : undefined,
      filters,
    })
    .then(({ data }) => {
      return data;
    });
};
