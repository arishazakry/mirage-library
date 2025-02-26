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
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import moment from "moment/moment";
import MapIcon from "@mui/icons-material/Map";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FemaleIcon from "@mui/icons-material/Female";
import MaleIcon from "@mui/icons-material/Male";
import TransgenderIcon from "@mui/icons-material/Transgender";
import { useSpring, animated, easings } from "@react-spring/web";
import { styled } from "@mui/material/styles";
import { useState, useRef, useEffect, useMemo } from "react";
import { format } from "d3";
import "./index.css";
import AutoSizer from "react-virtualized-auto-sizer";
import PaperCustom from "../PaperCustom";
// import {Helmet} from "react-helmet";
import RadarChart from "../RadarChart";
import Map from "../Map";
import Favorite from "@mui/icons-material/Favorite";
import spotifyIcon from "../../assets/Spotify_icon.svg";
import wikiIcon from "../../assets/wikilogo.png";
import musicbrainzIcon from "../../assets/musicbrainlogo.png";
import youtubeIcon from "../../assets/youtubelogo.png";
import geniusIcon from "../../assets/geniuslogo.png";
import { metricRadarList } from "@/lib/utils";

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

function genderIcon(g) {
  switch (g) {
    case "male":
      return { avatar: <MaleIcon style={{ marginRight: -12 }} />, label: "" };
    case "female":
      return { avatar: <FemaleIcon style={{ marginRight: -12 }} />, label: "" };
    default:
      return { label: g };
  }
}

function DetailCard({ data, onSelect, meanradar }) {
  const timeStation = moment(data.Event_MA_TimeStation).format("LLL");
  const duration = moment.utc(data.Track_SP_Duration * 1000).format("HH:mm:ss");
  const Event_SE_Description = data.Event_SE_Description ?? "N/A";
  const analyticData = useMemo(() => [data], [data]);
  const analyticAxis = useMemo(() => metricRadarList, []);

  return (
    <Stack spacing={1}>
      <PaperCustom>
        <Typography
          component="div"
          variant="h2"
          onClick={() =>
            onSelect({ station_rg_name: [data.station_rg_name] }, data)
          }
        >
          {data.station_rg_name}
        </Typography>
        {/*<Typography component="div" variant="subtitle1" color="text.secondary">*/}
        {/*    Form: <Chip label={data.Station_AR_Form} size={'small'}/>*/}
        {/*</Typography>*/}
        <table style={{ width: "100%" }}>
          <colgroup>
            <col style={{ width: 130 }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <td>Form</td>
              <td>
                <Stack
                  direction={"row"}
                  spacing={1}
                  flexWrap
                  sx={{ width: "100%", flexWrap: "wrap" }}
                >
                  <Chip label={data.Station_AR_Form} size={"small"} />
                  {data.station_ar_frequency && (
                    <>
                      {data.station_ar_frequency.map((d) => (
                        <Chip label={d} key={d} size={"small"} />
                      ))}
                    </>
                  )}{" "}
                </Stack>
              </td>
            </tr>
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
            <tr>
              <td>Formats</td>
              <td>
                {data.station_ar_format && (
                  <Stack
                    direction={"row"}
                    spacing={1}
                    flexWrap
                    sx={{ width: "100%", flexWrap: "wrap" }}
                  >
                    {data.station_ar_format.split(",").map((d) => (
                      <Chip label={d} key={d} size={"small"} />
                    ))}
                  </Stack>
                )}
              </td>
            </tr>
            <tr>
              <td>Genres</td>
              <td>
                {data.station_ar_genre && (
                  <Stack
                    direction={"row"}
                    spacing={1}
                    flexWrap
                    sx={{ width: "100%", flexWrap: "wrap" }}
                  >
                    {data.station_ar_genre.map((d) => (
                      <Chip label={d} key={d} size={"small"} />
                    ))}
                  </Stack>
                )}
              </td>
            </tr>
            <tr>
              <td>Description</td>
              <td>{data.Station_SE_Description}</td>
            </tr>
          </tbody>
        </table>
      </PaperCustom>

      <PaperCustom>
        <table style={{ width: "100%" }}>
          <colgroup>
            <col style={{ width: 130 }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <td>Stream name</td>
              <td>{Event_SE_Description}</td>
            </tr>
          </tbody>
          {/*<tr><td>Stream URL</td><td><Link href={data.stream_url} target={'_blank'} color={'secondary'}>{data.stream_url}</Link></td></tr>*/}
        </table>
      </PaperCustom>
      {data.artist_info && (
        <PaperCustom>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Box sx={{ flex: "1 0 auto", display: "flex" }}>
                <Avatar
                  aria-label="recipe"
                  src={data.artist_info.Artist_SP_ImageURL}
                  sx={{ mr: 1 }}
                >
                  {data.artist_info.artist_sp_name[0]}
                </Avatar>
                <div>
                  <Typography variant="h4" color={"text.primary"}>
                    {data.artist_info.artist_sp_name}
                  </Typography>
                  <Typography variant="subtitle2">
                    {data.artist_info.Artist_WD_Type}
                  </Typography>
                </div>
              </Box>
              <Typography
                component="div"
                variant="subtitle1"
                color="text.secondary"
              >
                {data.artist_info.Artist_WD_Description}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <table style={{ width: "100%" }}>
                <colgroup>
                  <col style={{ width: 130 }} />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <td>Popularity</td>
                    <td>
                      <Chip
                        icon={<Favorite />}
                        sx={{ marginRight: 1 }}
                        label={data.artist_info.Artist_SP_Popularity}
                        size={"small"}
                      />
                      ({format(",")(data.artist_info.Artist_SP_Followers)}{" "}
                      followers)
                    </td>
                  </tr>
                  <tr>
                    <td>From</td>
                    <td>{data.artist_info.Artist_WD_Country ?? "N/A"}</td>
                  </tr>
                  <tr>
                    <td>Genres</td>
                    <td>
                      {data.artist_info.Artist_SP_Genre &&
                        data.artist_info.Artist_SP_Genre.map((t) => (
                          <Chip key={t} label={t} size={"small"} />
                        ))}
                    </td>
                  </tr>
                  <tr>
                    <td>Instruments</td>
                    <td>
                      {data.artist_info.Artist_WD_Instruments.map((t) => (
                        <Chip key={t} label={t} size={"small"} />
                      ))}
                    </td>
                  </tr>
                  {data.artist_info.Artist_WD_Members &&
                  data.artist_info.Artist_WD_Members.length ? (
                    <tr>
                      <td>Members</td>
                      <td>
                        {data.artist_info.Artist_WD_Members.map(
                          ({
                            _id,
                            artist_sp_name,
                            Artist_SP_ImageURL,
                            Artist_WD_Genders,
                            Artist_WD_SexualOrientations,
                            Artist_WD_Ethnicities,
                            Artist_WD_VoiceTypes,
                          }) => (
                            <Chip
                              avatar={
                                <Avatar
                                  alt={artist_sp_name}
                                  src={Artist_SP_ImageURL}
                                />
                              }
                              key={_id}
                              label={
                                <>
                                  <strong>{artist_sp_name}</strong>
                                  {Artist_WD_Genders && (
                                    <Chip
                                      title={`Gender: ${Artist_WD_Genders}`}
                                      color={"error"}
                                      size={"small"}
                                      {...genderIcon(Artist_WD_Genders)}
                                    />
                                  )}
                                  {Artist_WD_SexualOrientations && (
                                    <Chip
                                      title={`Sexual Orientations: ${Artist_WD_SexualOrientations}`}
                                      size={"small"}
                                      {...genderIcon(
                                        Artist_WD_SexualOrientations
                                      )}
                                    />
                                  )}
                                  {Artist_WD_Ethnicities && (
                                    <Chip
                                      title={`Ethnicities: ${Artist_WD_Ethnicities}`}
                                      size={"small"}
                                      {...genderIcon(Artist_WD_Ethnicities)}
                                    />
                                  )}
                                  {Artist_WD_VoiceTypes &&
                                  Artist_WD_VoiceTypes.length ? (
                                    <Chip
                                      title={"Voice types"}
                                      label={Artist_WD_VoiceTypes.join(", ")}
                                      size={"small"}
                                    />
                                  ) : (
                                    ""
                                  )}
                                </>
                              }
                              variant={"outlined"}
                            />
                          )
                        )}
                      </td>
                    </tr>
                  ) : (
                    ""
                  )}
                  <tr>
                    <td>Website URL</td>
                    <td>
                      <Link
                        href={data.artist_info.Artist_WD_WebsiteURL}
                        target={"_blank"}
                        color={"secondary"}
                      >
                        {data.artist_info.Artist_WD_WebsiteURL}
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td>Identifiers</td>
                    <td>
                      <IconButton
                        href={`https://open.spotify.com/artist/${data.artist_info.Artist_SP_ID}`}
                        target={"_blank"}
                      >
                        <img src={spotifyIcon} width={30} loading="lazy" />
                      </IconButton>
                      {data.artist_info.Artist_WD_QID && (
                        <IconButton
                          href={`https://wikidata.org/wiki/${data.artist_info.Artist_WD_QID}`}
                          target={"_blank"}
                        >
                          <img src={wikiIcon} width={30} loading="lazy" />
                        </IconButton>
                      )}
                      {data.artist_info.Artist_WD_YouTubeID && (
                        <IconButton
                          href={`https://www.youtube.com/channel/${data.artist_info.Artist_WD_YouTubeID}`}
                          target={"_blank"}
                        >
                          <img src={youtubeIcon} width={30} loading="lazy" />
                        </IconButton>
                      )}
                      {data.artist_info.Artist_WD_MusicBrainzID && (
                        <IconButton
                          href={`https://musicbrainz.org/artist/${data.artist_info.Artist_WD_MusicBrainzID}`}
                          target={"_blank"}
                        >
                          <img
                            src={musicbrainzIcon}
                            width={30}
                            loading="lazy"
                          />
                        </IconButton>
                      )}
                    </td>
                  </tr>
                </tbody>
                {/*<tr><td>Stream URL</td><td><Link href={data.stream_url} target={'_blank'} color={'secondary'}>{data.stream_url}</Link></td></tr>*/}
              </table>
            </Grid>
          </Grid>
        </PaperCustom>
      )}
      <PaperCustom elevation={3}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Typography color="text.secondary" gutterBottom>
              {" "}
              {timeStation}
            </Typography>
          </Grid>
          <Grid item xs={12}>
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
            <Typography
              component="div"
              variant="subtitle1"
              color="text.secondary"
            >
              {data.Track_WD_Desciption}
            </Typography>
            <table style={{ width: "100%" }}>
              <colgroup>
                <col style={{ width: 130 }} />
                <col />
              </colgroup>
              <tbody>
                {data.Track_WD_Format && (
                  <tr>
                    <td>Form</td>
                    <td>{data.Track_WD_Format}</td>
                  </tr>
                )}
                {data.Track_WD_Composers && data.Track_WD_Composers.length ? (
                  <tr>
                    <td>Composers</td>
                    <td>
                      {data.Track_WD_Composers.map((t) => (
                        <Chip key={t} label={t} size={"small"} />
                      ))}
                    </td>
                  </tr>
                ) : (
                  ""
                )}
                {data.Track_WD_Lyricists && data.Track_WD_Lyricists.length ? (
                  <tr>
                    <td>Lyricists</td>
                    <td>
                      {data.Track_WD_Lyricists.map((t) => (
                        <Chip key={t} label={t} size={"small"} />
                      ))}
                    </td>
                  </tr>
                ) : (
                  ""
                )}
                {data.Track_WD_Language && (
                  <tr>
                    <td>Language</td>
                    <td>{data.Track_WD_Language}</td>
                  </tr>
                )}
                {data.Track_SP_Year && (
                  <tr>
                    <td>Year released</td>
                    <td>{data.Track_SP_Year}</td>
                  </tr>
                )}
                {data.Track_SP_Duration && (
                  <tr>
                    <td>Duration</td>
                    <td>{duration}</td>
                  </tr>
                )}
                {data.Track_SP_Popularity && (
                  <tr>
                    <td>Popularity</td>
                    <td>
                      <Chip
                        icon={<Favorite />}
                        label={data.Track_SP_Popularity}
                        size={"small"}
                      />
                    </td>
                  </tr>
                )}
                <tr>
                  <td>Key </td>
                  <td>
                    {data.Track_SP_Key}, {data.Track_SP_Mode}
                  </td>
                </tr>
                <tr>
                  <td>Beats per Measure</td>
                  <td>{data.Track_SP_BeatsPerBar}</td>
                </tr>
                {data.track_genre && (
                  <tr>
                    <td>Genre</td>
                    <td>{data.track_genre}</td>
                  </tr>
                )}
                {data.Track_SP_Loudness && (
                  <tr>
                    <td>Loudness</td>
                    <td>{data.Track_SP_Loudness} dB</td>
                  </tr>
                )}
                <tr>
                  <td>Platform</td>
                  <td>
                    {data.Track_SP_ID && (
                      <IconButton
                        href={`https://open.spotify.com/track/${data.Track_SP_ID}`}
                        target={"_blank"}
                      >
                        <img src={spotifyIcon} width={30} loading="lazy" />
                      </IconButton>
                    )}
                    {data.Track_WD_QID && (
                      <IconButton
                        href={`https://wikidata.org/wiki/${data.Track_WD_QID}`}
                        target={"_blank"}
                      >
                        <img src={wikiIcon} width={30} loading="lazy" />
                      </IconButton>
                    )}
                    {data.Track_WD_GeniusID && (
                      <IconButton
                        href={`https://genius.com/${data.Track_WD_GeniusID}`}
                        target={"_blank"}
                      >
                        <img src={geniusIcon} width={30} loading="lazy" />
                      </IconButton>
                    )}
                    {data.Track_WD_YouTubeID && (
                      <IconButton
                        href={`https://www.youtube.com/watch?v=${data.Track_WD_YouTubeID}`}
                        target={"_blank"}
                      >
                        <img src={youtubeIcon} width={30} loading="lazy" />
                      </IconButton>
                    )}
                    {data.Track_WD_MusicBrainzID && (
                      <IconButton
                        href={`https://musicbrainz.org/work/${data.Track_WD_MusicBrainzID}`}
                        target={"_blank"}
                      >
                        <img src={musicbrainzIcon} width={30} loading="lazy" />
                      </IconButton>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </Grid>
          <Grid item xs={12}>
            {data.Track_WD_Instrumentation &&
            data.Track_WD_Instrumentation.length ? (
              <Stack
                direction={"row"}
                spacing={1}
                flexWrap
                sx={{ width: "100%", flexWrap: "wrap" }}
              >
                <Typography>Instruments: </Typography>
                {data.Track_WD_Instrumentation.map((t) => (
                  <Chip key={t} label={t} size={"small"} />
                ))}
              </Stack>
            ) : (
              ""
            )}
          </Grid>
          <Grid item xs={12}>
            <Grid container>
              <Divider sx={{ mt: 2, mb: 2, flexGrow: 1 }} />
              <Typography
                variant={"h5"}
                component={"div"}
                sx={{ margin: "auto" }}
              >
                Metrics
              </Typography>
              <Divider sx={{ mt: 2, mb: 2, flexGrow: 1 }} />
            </Grid>
            <AutoSizer style={{ height: 300, width: "100%" }}>
              {({ height, width }) => {
                return (
                  <RadarChart
                    inputData={analyticData}
                    meanradar={meanradar}
                    axisInfo={analyticAxis}
                    height={height - 40}
                    width={width}
                  />
                );
              }}
            </AutoSizer>
          </Grid>
          {/*<Grid item xs={6}>*/}
          {/*    <Grid container>*/}
          {/*        <Divider sx={{mt: 2, mb: 2, flexGrow: 1}}/>*/}
          {/*        <Typography variant={"h5"} component={'div'} sx={{margin: 'auto'}}>*/}
          {/*            Lyrics {data.Track_WD_Language ? `(${data.Track_WD_Language})` : ""}*/}
          {/*        </Typography>*/}
          {/*        <Divider sx={{mt: 2, mb: 2, flexGrow: 1}}/>*/}
          {/*    </Grid>*/}
          {/*</Grid>*/}
        </Grid>
      </PaperCustom>
    </Stack>
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
