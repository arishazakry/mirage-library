import useStore from "@/store/strore";
import FloatingMusicWidget from ".";
import { useCallback } from "react";

export default function FloatingMusicWidgetWrapper({setIsWidgetVisible,isVisible}) {
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
        <FloatingMusicWidget songData={detail} 
            onClose={() => setIsWidgetVisible(false)}
            isVisible={isVisible} />
  );
}
