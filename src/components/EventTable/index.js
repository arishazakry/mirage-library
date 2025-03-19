import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  MaterialReactTable,
  MRT_ToolbarAlertBanner,
} from "material-react-table";
// import {fields} from "./fields";
import { Box, IconButton, Toolbar, Tooltip } from "@mui/material";
import AddEventIcon from "@mui/icons-material/AddShoppingCart";
import RemoveEventIcon from "@mui/icons-material/RemoveShoppingCart";
import useStore from "@/store/strore";
import useGetShortenLink from "@/store/useGetShortenLink";
import { Button } from "../ui/button";
const EventTable = ({
  id = "tableevent",
  columns,
  data,
  totalData,
  selectedData,
  disableAdding,
  isLoadingData,
  onSelectRow,
  highlightId,
  onSendToList,
  onRemoveFromList,
  _id = "event_ma_id",
  mainurl,
}) => {
  const [rowSelection, setRowSelection] = useState({});

  //optionally access the underlying virtualizer instance
  const rowVirtualizerInstanceRef = useRef(null);

  // const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sorting, setSorting] = useState([]);
  const { event_export_list } = useStore();
  const getShortenLink = useGetShortenLink();
  useEffect(() => {
    //scroll to the top of the table when the sorting changes
    try {
      rowVirtualizerInstanceRef.current?.scrollToIndex?.(0);
    } catch (error) {
      console.log(error);
    }
  }, [sorting]);

  useEffect(() => {
    setRowSelection({});
  }, [data]);
  // const handleExportRows = (rows) => {
  //   setIsLoading(true);
  //   getDownloadData(rows)
  //     .then((datadownload) => {
  //       const csvOptions = {
  //         fieldSeparator: "|",
  //         quoteStrings: '"',
  //         decimalSeparator: ".",
  //         showLabels: true,
  //         filename: `mirage-mc-${new Date().toDateString()}`,
  //         useBom: true,
  //         useKeysAsHeaders: true,
  //         headers: Object.keys(event_export_list),
  //       };
  //       const csvExporter = generateCsv(csvOptions);
  //       csvExporter.generateCsv(datadownload);
  //       setIsLoading(false);
  //     })
  //     .catch((e) => {
  //       setIsLoading(false);
  //     });
  // };
  // console.log(data)
  return (
    <MaterialReactTable
      key={id}
      id={id}
      columns={columns}
      data={data} //10,000 rows
      enableBottomToolbar={!!Object.keys(rowSelection).length}
      enableGlobalFilterModes
      enableDensityToggle={false}
      enablePagination={false}
      enableRowSelection
      // // enableRowNumbers
      enableRowVirtualization
      muiTablePaperProps={{
        sx: {
          display: "flex",
          flexDirection: "column",
          minHeight: 1,
          height: "100%",
          background: "unset",
          color: "unset",
        },
      }}
      muiTableContainerProps={{ sx: { background: "unset", color: "unset" } }}
      muiTableHeadCellProps={{ sx: { background: "unset", color: "unset" } }}
      muiPaginationProps={{ sx: { background: "unset", color: "unset" } }}
      initialState={{ density: "compact" }}
      onSortingChange={setSorting}
      onRowSelectionChange={setRowSelection}
      state={{ isLoading: isLoadingData || isLoading, sorting, rowSelection }}
      rowVirtualizerInstanceRef={rowVirtualizerInstanceRef} //optional
      rowVirtualizerProps={{ overscan: 2 }} //optionally customize the virtualizer
      muiTableBodyRowProps={({ row }) => ({
        onClick: () => {
          onSelectRow(row.original);
        },
        // sx: { cursor: 'pointer',opacity:highlightId?(highlightId.Event_MA_ID=== row.original.Event_MA_ID?1:0.7):1},
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
      })}
      muiSelectCheckboxProps={{ size: "small" }}
      muiTableBodyCellProps={{
        sx: {
          background: "unset",
          color: "unset",
          wordBreak: "break-word",
          whiteSpace: "normal",
        },
      }}
      enableColumnResizing={true}
      enableFullScreenToggle={false}
      defaultColumn={{
        minSize: 20, //allow columns to get smaller than default
        maxSize: 9001, //allow columns to get larger than default
        size: 120, //make columns wider by default
      }}
      layoutMode="grid"
      positionToolbarAlertBanner={"bottom"}
      // renderTopToolbarCustomActions={({ table }) => {
      //   return (
      //     <Box
      //       sx={{
      //         display: "flex",
      //         gap: "1rem",
      //         p: "0.5rem",
      //         flexWrap: "no-wrap",
      //       }}
      //     >
      //       <DownloadOption
      //         // onDownloadSearchList={()=>handleExportRows(table.getPrePaginationRowModel().rows)}
      //         onDownloadSearchList={() => handleExportRows(totalData)}
      //         onDownloadSelectedList={() => handleExportRows(selectedData)}
      //       />
      //       <ShareButton getUrl={getShortenLink} />
      //     </Box>
      //   );
      // }}
      renderBottomToolbar={({ table }) => {
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
          <Toolbar
            sx={{
              display: Object.keys(rowSelection).length ? "flex" : "none",
            }}
          >
            <Box sx={{ flexGrow: 2 }}>
              <MRT_ToolbarAlertBanner stackAlertBanner table={table} />
            </Box>
            {onSendToList && !disableAdding && (
              <Tooltip title={"Add to Selected list"}>
                <Button
                  // color="info"
                  // disabled={!table.getIsSomeRowsSelected()}
                  onClick={handleSelected}
                  variant="contained"
                >
                  <AddEventIcon />
                </Button>
              </Tooltip>
            )}
            {onRemoveFromList && (
              <Tooltip title={"Remove from Selected list"}>
                <Button
                  // color="info"
                  // disabled={!table.getIsSomeRowsSelected()}
                  onClick={handleRemoveSelected}
                  variant="contained"
                >
                  <RemoveEventIcon />
                </Button>
              </Tooltip>
            )}
          </Toolbar>
        );
      }}
    />
  );
};
export default EventTable;
