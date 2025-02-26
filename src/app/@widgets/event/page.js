"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fields } from "@/components/EventTable/fields";
import useStore from "@/store/strore"; // Zustand store
import { actionCreators } from "@/store/reducer/actions/selectedList";
import EventTable from "@/components/EventTable";
import { selectFilters } from "@/store/reducer/streamfilters";

export default function EventList() {
  const {
    detail,
    requestDetail,
    requestEvents,
    events,
    loading: { events: loadingEvents },
  } = useStore();
  const filters = useSelector(selectFilters);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(actionCreators.newList(events));
  }, [events]);

  const eventTotalData = useSelector((state) => state.seletedList.currentList);
  const eventSelectedData = useSelector((state) =>
    Object.values(state.seletedList.items)
  );

  const onSelectStream = useCallback(
    (data) => {
      requestDetail(data);
    },
    [requestDetail]
  );
  const fetchEvents = useCallback(
    (filter) => requestEvents(filter, 10000),
    [requestEvents] // Dependency ensures it's stable across renders
  );
  useEffect(() => {
    console.log(JSON.stringify(filters));
    fetchEvents(filters);
  }, [fetchEvents, filters]);
  return (
    <EventTable
      id="eventListTable"
      data={eventTotalData ?? []}
      columns={fields}
      isLoadingData={loadingEvents}
      onSelectRow={onSelectStream}
      highlightId={detail}
      totalData={eventTotalData}
      selectedData={eventSelectedData}
      onSendToList={(l) => dispatch(actionCreators.addsToBasket(l))}
      onRemoveFromList={(l) => dispatch(actionCreators.removeItems(l))}
      mainurl={`${window.location.origin}/`}
    />
  );
}
