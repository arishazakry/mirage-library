import SaveIcon from "@mui/icons-material/Save";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {Button, Menu, MenuItem} from "@mui/material";
import React from "react";

export default function({onDownloadSearchList=()=>{},onDownloadSelectedList=()=>{}}){
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    return <><Button
        color="primary"
        target={"_blank"}
        size={"small"}
        //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
        // onClick={handleExportData}
        startIcon={<SaveIcon/>}
        variant="contained"
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
    >
        Download
    </Button>
        <Menu anchorEl={anchorEl}
              open={open}
              onClose={handleClose}>
            <MenuItem onClick={()=>{onDownloadSearchList();handleClose();}}>Data from Search list</MenuItem>
            <MenuItem onClick={()=>{onDownloadSelectedList();handleClose();}}>Data from Selected list</MenuItem>
            <MenuItem disabled onClick={handleClose} href={process.env.REACT_APP_DATA_DOWNLOAD}>MIRAGE-MetaCorpus Song List</MenuItem>
            <MenuItem onClick={handleClose} disabled>MIRAGE-MetaCorpus Station List</MenuItem>
        </Menu>
        </>
}