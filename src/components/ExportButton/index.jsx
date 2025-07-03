import React, { useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { Crown, Share, Sparkle } from "lucide-react";
import { useSelector } from "react-redux";
import useStore from "@/store/strore";
import { selectFilters } from "@/store/reducer/streamfilters";
import { ExportProgress } from "../ExportProgress";

const ExportButton = () => {
  const {
    handleExportRows,
    loading: { exportdata: loading },
  } = useStore();
  const _eventSelectedData = useSelector((state) => state.seletedList.items);
  const eventSelectedData = useMemo(
    () => Array.from(_eventSelectedData.values()),
    [_eventSelectedData]
  );
  const filters = useSelector(selectFilters);
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="btn btn-primary" loading={loading}>
            <Share />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="flex gap-2 items-center">
            <Sparkle /> Free (up to 1000)
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              handleExportRows(undefined, filters);
            }}
          >
            Data from Search list
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              handleExportRows(eventSelectedData);
            }}
          >
            Data from Selected list
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex gap-2 items-center">
            <Crown />
            Contact us
          </DropdownMenuLabel>
          <DropdownMenuItem disabled href={process.env.REACT_APP_DATA_DOWNLOAD}>
            MIRAGE-MetaCorpus Song List
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            MIRAGE-MetaCorpus Station List
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ExportProgress isLoading={loading}/>
    </div>
  );
};

export default ExportButton;
