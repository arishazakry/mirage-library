import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  MaterialReactTable,
  MRT_TablePagination,
  MRT_ToolbarAlertBanner,
  useMaterialReactTable,
} from "material-react-table";
// import {fields} from "./fields";
import { Box, IconButton, Toolbar, Tooltip } from "@mui/material";
import AddEventIcon from "@mui/icons-material/AddShoppingCart";
import RemoveEventIcon from "@mui/icons-material/RemoveShoppingCart";
import useStore, { APIUrl } from "@/store/strore";
import useGetShortenLink from "@/store/useGetShortenLink";
import ShareButton from "../EventTable/ShareButton";
import {
  keepPreviousData,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";
import { Button } from "../ui/button";

const EventTableDynamic = ({
  id = "tableevent",
  columns,
  selectedData,
  disableAdding,
  onSelectRow,
  highlightId,
  onSendToList,
  onRemoveFromList,
  _id = "event_ma_id",
  filters = [],
  query,
  mainurl,
}) => {
  const [rowSelection, setRowSelection] = useState({});

  //optionally access the underlying virtualizer instance
  const rowVirtualizerInstanceRef = useRef(null);

  // const [data, setData] = useState([]);
  const [sorting, setSorting] = useState([]);
  const { event_export_list } = useStore();
  const getShortenLink = useGetShortenLink();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const queryKey = useMemo(
    () => ["users-list", { filters, pagination, sorting, query }],
    [filters, pagination, sorting, query]
  );
  const fetchData = useCallback(async () => {
    const { data } = await axios.post(`${APIUrl}/search/`, {
      filters,
      query,
      from: pagination.pageIndex * pagination.pageSize,
      size: pagination.pageSize,
      sortBy: sorting[0] ? sorting[0].id : undefined,
      sortOrder: sorting[0] ? (sorting[0].desc ? "DESC" : "ASC") : undefined,
    });
    return data;
  }, [filters, query, pagination, sorting]);
  const {
    data: { data = [], meta } = {}, //your data and api response will probably be different
    isError,
    isRefetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: fetchData,
    placeholderData: keepPreviousData, //don't go to 0 rows when refetching or paginating to next page
  });

  //   useEffect(() => {
  //     //scroll to the top of the table when the sorting changes
  //     try {
  //       rowVirtualizerInstanceRef.current?.scrollToIndex?.(0);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }, [sorting]);

  //   useEffect(() => {
  //     setRowSelection({});
  //   }, [data]);
  const table = useMaterialReactTable({
    key: id,
    id: id,
    columns: columns,
    pagination,
    data: data, //10,000 rows
    enableGlobalFilterModes: true,
    enableDensityToggle: false,
    enablePagination: true,
    manualPagination: true,
    onPaginationChange: setPagination,
    paginationDisplayMode: "pages",
    enableRowSelection: true,
    rowCount: meta?.totalRowCount ?? 0,
    showAlertBanner: isError,
    showProgressBars: isRefetching,
    muiTablePaperProps: {
      sx: {
        display: "flex",
        flexDirection: "column",
        minHeight: 1,
        height: "100%",
        background: "unset",
        color: "unset",
      },
    },
    muiTableContainerProps: { sx: { background: "unset", color: "unset" } },
    muiTableHeadCellProps: { sx: { background: "unset", color: "unset" } },
    muiPaginationProps: { sx: { background: "unset", color: "unset" } },
    initialState: { density: "compact" },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      isLoading,
      sorting,
      rowSelection,
      showProgressBars: isRefetching,
      pagination, // Ensure pagination is included in state
    },
    rowVirtualizerInstanceRef: rowVirtualizerInstanceRef, //optional
    rowVirtualizerProps: { overscan: 2 }, //optionally customize the virtualizer
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        onSelectRow(row.original);
      },
      sx: {
        background: "unset",
        color: "unset",
        cursor: "pointer",
        opacity: highlightId
          ? highlightId[_id] === row.original[_id]
            ? 1
            : 0.7
          : 1,
        fontStyle: highlightId
          ? highlightId[_id] === row.original[_id]
            ? "italic"
            : "normal"
          : "normal",
      },
    }),
    muiSelectCheckboxProps: {
      size: "small",
    },
    muiTableBodyCellProps: {
      sx: { wordBreak: "break-word", whiteSpace: "normal" },
    },
    enableColumnResizing: true,
    enableFullScreenToggle: false,
    defaultColumn: {
      minSize: 20, //allow columns to get smaller than default
      maxSize: 9001, //allow columns to get larger than default
      size: 120, //make columns wider by default
    },
    layoutMode: "grid",
    positionToolbarAlertBanner: "bottom",
    renderBottomToolbar: ({ table }) => {
      const handleSelected = onSendToList
        ? () => {
            onSendToList(
              table.getSelectedRowModel().flatRows.map((d) => d.original)
            );
          }
        : () => {};
      const handleRemoveSelected = onRemoveFromList
        ? () => {
            onRemoveFromList(
              table.getSelectedRowModel().flatRows.map((d) => d.original)
            );
          }
        : () => {};
      return (
        <Toolbar sx={{ flexDirection: "column" }}>
          <div className="flex items-center">
            <MRT_ToolbarAlertBanner stackAlertBanner table={table} />
            {Object.keys(rowSelection).length ? (
              <>
                {onSendToList && !disableAdding && (
                  <Tooltip title={"Add to Selected list"}>
                    <Button onClick={handleSelected} variant="contained">
                      <AddEventIcon />
                    </Button>
                  </Tooltip>
                )}
                {onRemoveFromList && (
                  <Tooltip title={"Remove from Selected list"}>
                    <Button onClick={handleRemoveSelected} variant="contained">
                      <RemoveEventIcon />
                    </Button>
                  </Tooltip>
                )}
              </>
            ) : (
              <div>
                <MRT_TablePagination table={table} />
              </div>
            )}
          </div>
        </Toolbar>
      );
    },
  });

  return <MaterialReactTable table={table} />;
};
export default EventTableDynamic;
