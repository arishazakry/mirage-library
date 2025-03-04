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
  const duration = moment.utc(data.track_sp_duration * 1000).format("HH:mm:ss");
  const event_se_description = data.event_se_description ?? "N/A";
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
        {/*    Form: <Chip label={data.station_ar_form} size={'small'}/>*/}
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
                  <Chip label={data.station_ar_form} size={"small"} />
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
                  href={data.station_rg_url}
                  target={"_blank"}
                  color={"secondary"}
                >
                  {data.station_rg_url}
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
              <td>{data.Station_SE_description}</td>
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
              <td>{event_se_description}</td>
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
                  src={data.artist_sp_imageurl}
                  sx={{ mr: 1 }}
                >
                  {data.artist_sp_name[0]}
                </Avatar>
                <div>
                  <Typography variant="h4" color={"text.primary"}>
                    {data.artist_sp_name}
                  </Typography>
                  <Typography variant="subtitle2">
                    {data.artist_wd_type}
                  </Typography>
                </div>
              </Box>
              <Typography
                component="div"
                variant="subtitle1"
                color="text.secondary"
              >
                {data.artist_wd_description}
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
                        label={data.artist_sp_popularity}
                        size={"small"}
                      />
                      ({format(",")(data.artist_sp_followers)} followers)
                    </td>
                  </tr>
                  <tr>
                    <td>From</td>
                    <td>{data.artist_wd_country ?? "N/A"}</td>
                  </tr>
                  <tr>
                    <td>Genres</td>
                    <td>
                      {data.artist_sp_genre &&
                        data.artist_sp_genre.map((t) => (
                          <Chip key={t} label={t} size={"small"} />
                        ))}
                    </td>
                  </tr>
                  <tr>
                    <td>Instruments</td>
                    <td>
                      {data.artist_wd_instruments.map((t) => (
                        <Chip key={t} label={t} size={"small"} />
                      ))}
                    </td>
                  </tr>
                  {data.artist_wd_members && data.artist_wd_members.length ? (
                    <tr>
                      <td>Members</td>
                      <td>
                        {data.artist_wd_members.map(
                          ({
                            _id,
                            artist_sp_name,
                            artist_sp_imageurl,
                            artist_wd_genders,
                            artist_wd_sexualorientations,
                            artist_wd_ethnicities,
                            artist_wd_voiceTypes,
                          }) => (
                            <Chip
                              avatar={
                                <Avatar
                                  alt={artist_sp_name}
                                  src={artist_sp_imageurl}
                                />
                              }
                              key={_id}
                              label={
                                <>
                                  <strong>{artist_sp_name}</strong>
                                  {artist_wd_genders && (
                                    <Chip
                                      title={`Gender: ${artist_wd_genders}`}
                                      color={"error"}
                                      size={"small"}
                                      {...genderIcon(artist_wd_genders)}
                                    />
                                  )}
                                  {artist_wd_sexualorientations && (
                                    <Chip
                                      title={`Sexual Orientations: ${artist_wd_sexualorientations}`}
                                      size={"small"}
                                      {...genderIcon(
                                        artist_wd_sexualorientations
                                      )}
                                    />
                                  )}
                                  {artist_wd_ethnicities && (
                                    <Chip
                                      title={`Ethnicities: ${artist_wd_ethnicities}`}
                                      size={"small"}
                                      {...genderIcon(artist_wd_ethnicities)}
                                    />
                                  )}
                                  {artist_wd_voiceTypes &&
                                  artist_wd_voiceTypes.length ? (
                                    <Chip
                                      title={"Voice types"}
                                      label={artist_wd_voiceTypes.join(", ")}
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
                        href={data.artist_wd_websiteurl}
                        target={"_blank"}
                        color={"secondary"}
                      >
                        {data.artist_wd_websiteurl}
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td>Identifiers</td>
                    <td>
                      <IconButton
                        href={`https://open.spotify.com/artist/${data.artist_sp_id}`}
                        target={"_blank"}
                      >
                        <img src={spotifyIcon} width={30} loading="lazy" />
                      </IconButton>
                      {data.artist_wd_qid && (
                        <IconButton
                          href={`https://wikidata.org/wiki/${data.artist_wd_qid}`}
                          target={"_blank"}
                        >
                          <img src={wikiIcon} width={30} loading="lazy" />
                        </IconButton>
                      )}
                      {data.artist_wd_youtubeid && (
                        <IconButton
                          href={`https://www.youtube.com/channel/${data.artist_wd_youtubeid}`}
                          target={"_blank"}
                        >
                          <img src={youtubeIcon} width={30} loading="lazy" />
                        </IconButton>
                      )}
                      {data.artist_wd_musicbrainzid && (
                        <IconButton
                          href={`https://musicbrainz.org/artist/${data.artist_wd_musicbrainzid}`}
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
            <p className="text-muted-foreground"> {timeStation}</p>
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
              {data.track_wd_desciption}
            </Typography>
            <table style={{ width: "100%" }}>
              <colgroup>
                <col style={{ width: 130 }} />
                <col />
              </colgroup>
              <tbody>
                {data.track_wd_Format && (
                  <tr>
                    <td>Form</td>
                    <td>{data.track_wd_Format}</td>
                  </tr>
                )}
                {data.track_wd_composers && data.track_wd_composers.length ? (
                  <tr>
                    <td>Composers</td>
                    <td>
                      {data.track_wd_composers.map((t) => (
                        <Chip key={t} label={t} size={"small"} />
                      ))}
                    </td>
                  </tr>
                ) : (
                  ""
                )}
                {data.track_wd_Lyricists && data.track_wd_Lyricists.length ? (
                  <tr>
                    <td>Lyricists</td>
                    <td>
                      {data.track_wd_Lyricists.map((t) => (
                        <Chip key={t} label={t} size={"small"} />
                      ))}
                    </td>
                  </tr>
                ) : (
                  ""
                )}
                {data.track_wd_language && (
                  <tr>
                    <td>Language</td>
                    <td>{data.track_wd_language}</td>
                  </tr>
                )}
                {data.track_sp_year && (
                  <tr>
                    <td>Year released</td>
                    <td>{data.track_sp_year}</td>
                  </tr>
                )}
                {data.track_sp_duration && (
                  <tr>
                    <td>Duration</td>
                    <td>{duration}</td>
                  </tr>
                )}
                {data.track_sp_popularity && (
                  <tr>
                    <td>Popularity</td>
                    <td>
                      <Chip
                        icon={<Favorite />}
                        label={data.track_sp_popularity}
                        size={"small"}
                      />
                    </td>
                  </tr>
                )}
                <tr>
                  <td>Key </td>
                  <td>
                    {data.track_sp_Key}, {data.track_sp_mode}
                  </td>
                </tr>
                <tr>
                  <td>Beats per Measure</td>
                  <td>{data.track_sp_BeatsPerBar}</td>
                </tr>
                {data.track_genre && (
                  <tr>
                    <td>Genre</td>
                    <td>{data.track_genre}</td>
                  </tr>
                )}
                {data.track_sp_loudness && (
                  <tr>
                    <td>Loudness</td>
                    <td>{data.track_sp_loudness} dB</td>
                  </tr>
                )}
                <tr>
                  <td>Platform</td>
                  <td>
                    {data.track_sp_id && (
                      <IconButton
                        href={`https://open.spotify.com/track/${data.track_sp_id}`}
                        target={"_blank"}
                      >
                        <img src={spotifyIcon} width={30} loading="lazy" />
                      </IconButton>
                    )}
                    {data.track_wd_qid && (
                      <IconButton
                        href={`https://wikidata.org/wiki/${data.track_wd_qid}`}
                        target={"_blank"}
                      >
                        <img src={wikiIcon} width={30} loading="lazy" />
                      </IconButton>
                    )}
                    {data.track_wd_geniusid && (
                      <IconButton
                        href={`https://genius.com/${data.track_wd_geniusid}`}
                        target={"_blank"}
                      >
                        <img src={geniusIcon} width={30} loading="lazy" />
                      </IconButton>
                    )}
                    {data.track_wd_youtubeid && (
                      <IconButton
                        href={`https://www.youtube.com/watch?v=${data.track_wd_youtubeid}`}
                        target={"_blank"}
                      >
                        <img src={youtubeIcon} width={30} loading="lazy" />
                      </IconButton>
                    )}
                    {data.track_wd_musicbrainzid && (
                      <IconButton
                        href={`https://musicbrainz.org/work/${data.track_wd_musicbrainzid}`}
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
            {data.track_wd_instrumentation &&
            data.track_wd_instrumentation.length ? (
              <Stack
                direction={"row"}
                spacing={1}
                flexWrap
                sx={{ width: "100%", flexWrap: "wrap" }}
              >
                <Typography>Instruments: </Typography>
                {data.track_wd_instrumentation.map((t) => (
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
          {/*            Lyrics {data.track_wd_language ? `(${data.track_wd_language})` : ""}*/}
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
