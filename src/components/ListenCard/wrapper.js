import useStore from "@/store/strore";
import ListenCard from ".";
import { useCallback } from "react";

export default function ListenCardWrapper() {
  const {
    detail,
    requestDetail,
    loading: { events: loadingDetail },
  } = useStore();
  const onSelect = useCallback(
    (data) => {
      requestDetail(data);
    },
    [requestDetail]
  );

  return (
    <div className="flex flex-col h-full w-full p-2 overflow-auto">
      {detail ? (
        <ListenCard data={detail} onSelect={onSelect} />
      ) : (
        <>Select from Event List</>
      )}
    </div>
  );
}
