"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fields } from "@/components/EventTable/fields";
import useStore from "@/store/strore"; // Zustand store
import { actionCreators } from "@/store/reducer/actions/selectedList";
import EventTable from "@/components/EventTable";
import { selectFilters } from "@/store/reducer/streamfilters";
import EventTableDynamic from "@/components/EventTableDynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();
export default function EventList() {
  const {
    detail,
    requestDetail,
    requestEvents,
    query,
    events,
    loading: { events: loadingEvents },
  } = useStore();
  const filters = useSelector(selectFilters);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(actionCreators.newList(events));
  }, [events]);

  const eventTotalData = useSelector((state) => state.seletedList.currentList);
  const _eventSelectedData = useSelector((state) => state.seletedList.items);
  const eventSelectedData = useMemo(
    () => Array.from(_eventSelectedData.values()),
    [_eventSelectedData]
  );

  const onSelectStream = useCallback(
    (data) => {
      requestDetail(data);
    },
    [requestDetail]
  );
  // const fetchEvents = useCallback(
  //   (filter, query) => requestEvents(filter, query, 10000),
  //   [requestEvents] // Dependency ensures it's stable across renders
  // );
  // useEffect(() => {
  //   fetchEvents(filters, query);
  // }, [fetchEvents, filters, query]);

  return (
    // <EventTable
    //   id="eventListTable"
    //   data={eventTotalData ?? []}
    //   columns={fields}
    //   isLoadingData={loadingEvents}
    //   onSelectRow={onSelectStream}
    //   highlightId={detail}
    //   totalData={eventTotalData}
    //   selectedData={eventSelectedData}
    //   onSendToList={(l) => dispatch(actionCreators.addsToBasket(l))}
    //   onRemoveFromList={(l) => dispatch(actionCreators.removeItems(l))}
    //   mainurl={`${window.location.origin}/`}
    // />
    <QueryClientProvider client={queryClient}>
      <EventTableDynamic
        id="eventListTable"
        columns={fields}
        isLoadingData={loadingEvents}
        onSelectRow={onSelectStream}
        highlightId={detail}
        // totalData={eventTotalData}
        selectedData={eventSelectedData}
        onSendToList={(l) => dispatch(actionCreators.addsToBasket(l))}
        onRemoveFromList={(l) => dispatch(actionCreators.removeItems(l))}
        mainurl={`${window.location.origin}/`}
        filters={filters}
        query={query}
      />
    </QueryClientProvider>
  );
}
