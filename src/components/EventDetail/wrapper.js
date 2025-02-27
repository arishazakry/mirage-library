import {
  Box,
  Card,
  CardContent,
  Collapse,
  DialogContent,
  Dialog,
  IconButton,
  Paper,
  Portal,
  Tab,
  Tabs,
  Typography,
  Unstable_Grid2 as Grid,
} from "@mui/material";
import { semicolor } from "../../containers/LayoutContainer/theme";
import MinimizeIcon from "@mui/icons-material/Minimize";
import CropFreeIcon from "@mui/icons-material/CropFree";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import DetailCard from "../DetailCard";
import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import Map from "../Map";
import AutoSizer from "react-virtualized-auto-sizer";
import { groups } from "d3";

export default function EventDetail({
  currentDetail,
  onTogleWin,
  locs,
  events,
  onSelect,
  sx = {},
}) {
  const [isFull, setIsFull] = useState(false);
  const [valueTab, setValueTab] = useState(0);
  const [eventlocs, setEventlocs] = useState([]);

  useEffect(() => {
    try {
      const _locsMap = {};
      locs.forEach((d) => (_locsMap[d["location_rg_id"]] = d));
      const _locs = groups(events, (d) => d["location_rg_id"]).map(
        ([c, cou]) => ({
          title: _locsMap[c]?.title,
          location_rg_id: c,
          count: cou.length,
          lat: _locsMap[c]?.lat,
          long: _locsMap[c]?.long,
        })
      );
      setEventlocs(_locs);
    } catch (e) {}
  }, [locs, events]);

  const handleChangeTab = (event, newValueTab) => {
    setValueTab(newValueTab);
  };

  const handleClose = useCallback(() => {
    setIsFull(false);
  }, [isFull]);

  const renderContent = () => {
    return (
      <>
        <Box
          sx={{ borderBottom: 1, borderColor: "divider" }}
          display={"flex"}
          justifyContent={"space-between"}
        >
          <Box>
            <Tabs
              value={valueTab}
              onChange={handleChangeTab}
              aria-label="basic tabs example"
            >
              <Tab label="Map" {...a11yProps(0)} />
              <Tab label="Event Info" {...a11yProps(1)} />
            </Tabs>
          </Box>
          {isFull ? (
            <IconButton size={"small"} onClick={() => setIsFull(false)}>
              <FullscreenExitIcon />
            </IconButton>
          ) : (
            <IconButton size={"small"} onClick={() => setIsFull(true)}>
              <CropFreeIcon />
            </IconButton>
          )}
        </Box>
        {/*<Grid item sx={{height:'100%'}} flexGrow={2}>*/}
        {/*{(valueTab === 0)?<Map/>:''}*/}
        <TabPanel value={valueTab} index={0} sx={{ height: "100%" }}>
          <CardContent
            style={{
              margin: "auto",
              display: "block",
              maxWidth: "100%",
              height: "100%",
              padding: 0,
            }}
          >
            <AutoSizer style={{ height: "100%", width: "100%" }}>
              {({ height, width }) => {
                return (
                  <Map
                    height={height}
                    width={width}
                    locs={eventlocs}
                    highlight={currentDetail}
                  />
                );
              }}
            </AutoSizer>
          </CardContent>
        </TabPanel>
        <TabPanel
          value={valueTab}
          index={1}
          style={{ height: "100%", overflowY: "auto" }}
        >
          {valueTab === 1 && (
            <CardContent sx={{ width: "100%" }}>
              {currentDetail ? (
                <DetailCard data={currentDetail} onSelect={onSelect} />
              ) : (
                <>Select from Event List</>
              )}
            </CardContent>
          )}
        </TabPanel>
      </>
    );
  };
  return (
    <>
      <Card
        sx={{
          ...sx,
          width: "100%",
          height: "100%",
          backgroundColor: (theme) => semicolor(theme.palette.background.paper),
        }}
      >
        <CardContent sx={{ height: "100%", position: "relative" }}>
          <Typography>Event Info & Visualizations</Typography>
          <IconButton
            aria-label="close"
            onClick={onTogleWin}
            sx={{
              position: "absolute",
              right: 0,
              top: 0,
            }}
          >
            <MinimizeIcon />
          </IconButton>

          <Grid
            container
            style={{ height: "100%", width: "100%" }}
            m={0}
            flexDirection={"column"}
            flexWrap={"nowrap"}
            sx={{ bgcolor: (theme) => theme.palette.background.paper }}
          >
            {renderContent()}
          </Grid>
        </CardContent>
      </Card>
      <Dialog fullScreen open={isFull} onClose={handleClose}>
        <DialogContent sx={{ padding: 0 }}>
          <Grid
            container
            style={{ width: "100%", height: "100%" }}
            m={0}
            flexDirection={"column"}
            flexWrap={"nowrap"}
          >
            {renderContent()}
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
}

function a11yProps(index) {
  return {
    id: `event-tab-${index}`,
    "aria-controls": `event-tabpanel-${index}`,
  };
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Card
      role="tabpanel"
      hidden={value !== index}
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
      {...other}
    >
      {value === index && <>{children}</>}
    </Card>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};
