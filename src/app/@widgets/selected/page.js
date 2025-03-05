"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fields } from "@/components/EventTable/fields";
import useStore from "@/store/strore"; // Zustand store
import { actionCreators } from "@/store/reducer/actions/selectedList";
import EventTable from "@/components/EventTable";
import { selectFilters } from "@/store/reducer/streamfilters";

export default function EventSelectedList() {
  const {
    detail,
    requestDetail,
    // requestEvents,
    // events,
    loading: { events: loadingEvents },
  } = useStore();
  const filters = useSelector(selectFilters);
  const dispatch = useDispatch();

  const eventTotalData = useSelector((state) => state.seletedList.currentList);
  const eventSelectedData = useSelector((state) =>
    Array.from(state.seletedList.items.values())
  );

  const onSelectStream = useCallback(
    (data) => {
      requestDetail(data);
    },
    [requestDetail]
  );
  return (
    <EventTable
      id="eventSelectedListTable"
      data={eventSelectedData ?? []}
      columns={fields}
      isLoadingData={loadingEvents}
      onSelectRow={onSelectStream}
      highlightId={detail}
      totalData={eventTotalData}
      selectedData={eventSelectedData}
      disableAdding={true}
      onSendToList={(l) => dispatch(actionCreators.addsToBasket(l))}
      onRemoveFromList={(l) => dispatch(actionCreators.removeItems(l))}
      mainurl={`${window.location.origin}/`}
    />
  );
}
