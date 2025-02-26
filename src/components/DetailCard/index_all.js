import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import moment from "moment/moment";
import MapIcon from "@mui/icons-material/Map";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useSpring, animated, easings } from "@react-spring/web";
import { styled } from "@mui/material/styles";
import { useState, useRef, useEffect } from "react";
import "./index.css";
import AutoSizer from "react-virtualized-auto-sizer";

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <ExpandMoreIcon {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
}));

function DetailCard({ data, onSelect }) {
  const timeStation = moment(data.Event_MA_TimeStation).format("LLL");
  const stream_name = data.stream_name ?? "N/A";
  return (
    <>
      <Typography
        component="div"
        variant="h2"
        onClick={() =>
          onSelect({ station_rg_name: [data.station_rg_name] }, data)
        }
      >
        {data.station_rg_name}{" "}
        <Typography component={"span"} variant={"subtitle1"}>
          {data.broadcast_frequency ?? "0.0"} FM
        </Typography>
      </Typography>
      <Typography component="div" variant="subtitle1" color="text.secondary">
        {data.Station_SE_Description}
      </Typography>
      <table style={{ width: "100%" }}>
        <colgroup>
          <col style={{ width: 130 }} />
          <col />
        </colgroup>
        <tbody>
          <tr>
            <td>Station URL</td>
            <td>
              <Link
                href={data.station_se_websiteURL}
                target={"_blank"}
                color={"secondary"}
              >
                {data.station_se_websiteURL}
              </Link>
            </td>
          </tr>
          <tr>
            <td>Location</td>
            <td>
              <Link
                target={"_blank"}
                color={"secondary"}
                href={`https://maps.google.com/?q=${data.lat},${data.long}`}
              >
                <MapIcon />
                {data.location_rg_city}, {data.location_rg_country}
              </Link>
            </td>
          </tr>
          <tr>
            <td>Radio Garden URL</td>
            <td>
              <Link
                href={data.Station_RG_URL}
                target={"_blank"}
                color={"secondary"}
              >
                {data.Station_RG_URL}
              </Link>
            </td>
          </tr>
        </tbody>
      </table>
      {/*<table style={{width:'100%'}}>*/}
      {/*    <colgroup><col style={{width:130}}/><col/></colgroup>*/}
      {/*    <Collapse>*/}
      {/*        <tbody>*/}
      {/*        <tr><td>Station URL</td><td><Link href={data.station_se_websiteURL} target={'_blank'} color={'secondary'}>{data.station_se_websiteURL}</Link></td></tr>*/}
      {/*        <tr><td>Location</td><td><Link target={'_blank'} color={'secondary'} href={`https://maps.google.com/?q=${data.lat},${data.long}`}><MapIcon/>{data.location_rg_city}, {data.location_rg_country}</Link></td></tr>*/}
      {/*        <tr><td>Radio Garden URL</td><td><Link href={data.Station_RG_URL} target={'_blank'} color={'secondary'}>{data.Station_RG_URL}</Link></td></tr>*/}
      {/*        </tbody>*/}
      {/*    </Collapse>*/}
      {/*    <tr>*/}
      {/*        <td colspan="2">*/}
      {/*            <Grid container>*/}
      {/*                <Divider sx={{mt:2,mb:2, flexGrow:1}}/>*/}
      {/*                <Typography variant={"h5"} component={'div'} sx={{margin: 'auto'}}>Stream</Typography>*/}
      {/*                <Divider sx={{mt:2,mb:2, flexGrow:1}}/>*/}
      {/*            </Grid>*/}
      {/*        </td>*/}
      {/*    </tr>*/}
      {/*    <tr><td>Name</td><td>{stream_name}</td></tr>*/}
      {/*    <tr><td>Description</td><td>{data.stream_description}</td></tr>*/}
      {/*    <tr><td>Stream Name</td><td>{stream_name}</td></tr>*/}
      {/*    <tr><td>Stream Name</td><td>{stream_name}</td></tr>*/}
      {/*    <Collapse>*/}
      {/*    </Collapse>*/}
      {/*    <tr><td colspan="2"><Divider sx={{mt:2,mb:2}}/></td></tr>*/}
      {/*</table>*/}
      {(data.stream_name || data.stream_genre || data.stream_url) && (
        <CollapsibleComp header={"Stream Info"} defaultValue={true}>
          <CardContent>
            <Link href={data.stream_url} target={"_blank"} color={"secondary"}>
              {data.stream_url}
            </Link>
            <Typography variant={"h4"}>{stream_name}</Typography>
            <Typography color="text.secondary" gutterBottom>
              {" "}
              {data.stream_description}
            </Typography>
            {data.stream_genre && (
              <Stack
                direction={"row"}
                spacing={1}
                flexWrap
                sx={{ width: "100%", flexWrap: "wrap" }}
              >
                <Chip label={data.stream_genre} size={"small"} />
              </Stack>
            )}
          </CardContent>
        </CollapsibleComp>
      )}
      {/*<CollapsibleComp header={'Event'} banner={<>"{data.track_sp_name}" by "{data.artist_sp_name}" at {timeStation}</>}>*/}
      <CollapsibleComp
        header={"Event"}
        banner={
          <>
            "{data.track_sp_name}" at {timeStation}
          </>
        }
      >
        <CardContent>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography color="text.secondary" gutterBottom>
                {" "}
                {timeStation}
              </Typography>
            </Grid>
            <Grid item flexGrow={1}>
              <Typography
                variant="h4"
                component="div"
                onClick={
                  data.track_sp_name
                    ? () => onSelect({ track_sp_name: [data.track_sp_name] })
                    : null
                }
              >
                {data.track_sp_name}
              </Typography>
              {data.year_released && (
                <Typography color="text.secondary" gutterBottom>
                  {" "}
                  {data.year_released}
                </Typography>
              )}
              {data.track_name_genre && (
                <Chip label={data.track_name_genre} size={"small"} />
              )}
            </Grid>
            <Grid item>
              <Box sx={{ flex: "1 0 auto", display: "flex" }}>
                <Avatar
                  aria-label="recipe"
                  src={data.artist_name_image_url}
                  sx={{ mr: 1 }}
                >
                  {data.artist_sp_name[0]}
                </Avatar>
                <div>
                  <Typography variant="h5" color={"text.primary"}>
                    {data.artist_sp_name}
                  </Typography>
                  <Typography variant="subtitle2">
                    from {data.artist_name_country ?? "N/A"}
                  </Typography>
                </div>
              </Box>
              {data.artist_name_genre &&
                data.artist_name_genre.map((t) => (
                  <Chip key={t} label={t} size={"small"} />
                ))}
            </Grid>
            <Grid item xs={12}>
              {data.stream_instrument_list && (
                <Stack
                  direction={"row"}
                  spacing={1}
                  flexWrap
                  sx={{ width: "100%", flexWrap: "wrap" }}
                >
                  <Typography>Instruments: </Typography>
                  {data.stream_instrument_list.split(";").map((t) => (
                    <Chip key={t} label={t} size={"small"} />
                  ))}
                </Stack>
              )}
            </Grid>
            {data.stream_lyrics && (
              <Grid item xs={12}>
                <Grid container>
                  <Divider sx={{ mt: 2, mb: 2, flexGrow: 1 }} />
                  <Typography
                    variant={"h5"}
                    component={"div"}
                    sx={{ margin: "auto" }}
                  >
                    Lyrics{" "}
                    {data.stream_lyrics_language
                      ? `(${data.stream_lyrics_language})`
                      : ""}
                  </Typography>
                  <Divider sx={{ mt: 2, mb: 2, flexGrow: 1 }} />
                </Grid>
                {data.stream_lyrics}
                {/*<table style={{width:'100%'}}>*/}
                {/*    {data.artist_sp_name&&<tr onClick={() => onSelect({artist_sp_name: [data.artist_sp_name]})}>*/}
                {/*        <td>Artist</td>*/}
                {/*        <td style={{display: 'flex'}}><Avatar aria-label="recipe"*/}
                {/*                                              src={data.artist_name_image_url}*/}
                {/*                                              sx={{mr: 1}}>{data.artist_sp_name[0]}</Avatar>*/}
                {/*            <div>*/}
                {/*                <Typography variant="h5" color={'text.primary'}>{data.artist_sp_name}</Typography>*/}
                {/*                <Typography variant="subtitle2">N/A</Typography>*/}
                {/*            </div>*/}
                {/*        </td>*/}
                {/*    </tr>}*/}
                {/*    <tr onClick={data.track_sp_name?()=>onSelect({track_sp_name:[data.track_sp_name]}):null}><td>Song</td><td>{data.track_sp_name}</td></tr>*/}
                {/*    <tr><td>Time Monitored</td><td>{timeStation}</td></tr>*/}
                {/*</table>*/}
              </Grid>
            )}
            {(data.spotify_uri || data.youtube_url) && (
              <Grid item xs={12}>
                <Grid container>
                  <Divider sx={{ mt: 2, mb: 2, flexGrow: 1 }} />
                  <Typography
                    variant={"h5"}
                    component={"div"}
                    sx={{ margin: "auto" }}
                  >
                    Music Platform
                  </Typography>
                  <Divider sx={{ mt: 2, mb: 2, flexGrow: 1 }} />
                </Grid>
                {data.spotify_uri && (
                  <Grid item xs={12}>
                    <iframe
                      loading="lazy"
                      src={data.spotify_uri.replace(
                        "com/track",
                        "com/embed/track"
                      )}
                      width={"100%"}
                      height="80"
                      frameBorder="0"
                      data-mce-fragment="1"
                    ></iframe>
                  </Grid>
                )}
                {data.youtube_url && (
                  <Grid item xs={12}>
                    <iframe
                      width={"100%"}
                      height={"auto"}
                      loading="lazy"
                      src={data.youtube_url.replace(
                        "youtube.com/watch?v=",
                        "youtube-nocookie.com/embed/"
                      )}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </Grid>
                )}
              </Grid>
            )}
          </Grid>
        </CardContent>
      </CollapsibleComp>

      {/*<Typography component="div" variant="subtitle1" color="text.secondary">*/}
      {/*    Time Monitored : {moment(data.Event_MA_TimeStation).format('LLL')}*/}
      {/*</Typography>*/}
    </>
  );
}
export default DetailCard;

function CollapsibleComp({ header, banner, defaultValue, ...props }) {
  const [open, setopen] = useState(defaultValue);
  const runningText = useSpring({
    reset: open,
    cancel: open,
    config: { duration: 20000 },
    loop: !open,
    from: { transform: "translateX(100%)" },
    to: { transform: "translateX(-100%)" },
  });
  return (
    <Card elevation={10} sx={{ mt: 1 }}>
      <CardActions disableSpacing>
        <Typography variant={"h5"}>{header}</Typography>
        {banner && !open && (
          <div
            style={{
              width: "100%",
              overflow: "hidden",
              marginLeft: 10,
              marginRight: 10,
              whiteSpace: "nowrap",
            }}
          >
            <Typography variant={"subtitle2"}>
              <animated.div style={runningText} className={"textbanner"}>
                {banner}
              </animated.div>
              {/*<div className={'textbanner'}>{banner} | {banner}</div>*/}
            </Typography>
          </div>
        )}
        <ExpandMore expand={open} onClick={() => setopen(!open)} />
      </CardActions>
      <Collapse in={open} unmountOnExit={true} {...props} />
    </Card>
  );
}
