import {semicolor} from "../../containers/LayoutContainer/theme";
import {Card, CardContent, IconButton, Typography} from "@mui/material";
import MinimizeIcon from "@mui/icons-material/Minimize";
import EventTable from "./index";

export default function ({data,isLoadingData,onTogleWin,onSelectRow,highlightId}) {
    return <Card sx={{ backgroundColor:(theme)=> semicolor(theme.palette.background.paper),height:'100%',position:'relative'}}>
        <CardContent sx={{height: '100%', position: 'relative'}}>
            <Typography>Event List</Typography>
            <IconButton
                aria-label="close"
                onClick={onTogleWin}
                sx={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                }}
            >
                <MinimizeIcon />
            </IconButton>

            <div style={{height:'100%'}}>
                <EventTable data={data} isLoadingData={isLoadingData} onSelectRow={onSelectRow} highlightId={highlightId}/>
            </div>
        </CardContent>
    </Card>
}