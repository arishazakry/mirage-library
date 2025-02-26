import {Button, TextField, Stack} from "@mui/material";
import React, {Fragment, useState} from "react";
import QuestionDialog from '../../components/Dialog';

export default function ShareButton({getUrl}){
    const [dialogOpen,setDialogOpen] = useState(false);
    const [url,setUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false)

    const closeDialog = () => {
        setDialogOpen(false);
    }
    const openDialog = () => {
        setIsProcessing(true);
        getUrl().then(d=>{
            setUrl(d);
            setDialogOpen(true);
            setIsProcessing(false);
        }).catch((e)=>{
            setUrl('');
            setIsProcessing(false);
        })
    }
    return <Fragment>
    <Button variant="contained" onClick={openDialog}>Share</Button>
    <QuestionDialog
        isOpen={dialogOpen}
        handleClose={closeDialog}
        isProcessing={isProcessing}
        title={'Share URL'}
        maxWidth={"md"}
        message={<Stack direction="collumn">
            <TextField 
                size="small"
                label="" 
                variant="outlined" 
                InputProps={{
                    readOnly: true,
                }}
                value={url}
            />
            <Button variant="contained" size="small"
                onClick={() => {navigator.clipboard.writeText(url)}}>
                    Copy
            </Button>
        </Stack>}
    />
    </Fragment>
}