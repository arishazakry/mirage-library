import {
  Avatar,
  Box,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled } from "@mui/material/styles";
import "./index.css";
import PaperCustom from "../PaperCustom";

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

function ListenCard({ data, onSelect }) {
  return (
    <div className="flex flex-col gap-1">
      <PaperCustom>
        <Grid container spacing={1}>
          <Grid item xs={6}>
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
                src={data.artist_sp_imageurl}
                sx={{ mr: 1 }}
              >
                {data.artist_sp_name[0]}
              </Avatar>
              <div>
                <Typography variant="h5" color={"text.primary"}>
                  {data.artist_sp_name}
                </Typography>
                <Typography variant="subtitle2">
                  from {data.artist_wd_country ?? "N/A"}
                </Typography>
              </div>
            </Box>
            {data.artist_sp_genre &&
              data.artist_sp_genre.map((t) => (
                <Chip key={t} label={t} size={"small"} />
              ))}
          </Grid>
        </Grid>
      </PaperCustom>
      <PaperCustom>
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
          <Grid item xs={12}>
            <iframe
              loading="lazy"
              src={`https://open.spotify.com/embed/track/${data.track_sp_id}`}
              width={"100%"}
              height="80"
              frameBorder="0"
              data-mce-fragment="1"
            ></iframe>
          </Grid>
          {(data.spotify_uri || data.track_wd_youtubeid) && (
            <>
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
              {data.track_wd_youtubeid && (
                <Grid item xs={12}>
                  <iframe
                    width={"100%"}
                    height={"auto"}
                    loading="lazy"
                    src={`https://www.youtube-nocookie.com/embed/${data.track_wd_youtubeid}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </Grid>
              )}
            </>
          )}
        </Grid>
      </PaperCustom>
    </div>
  );
}

export default ListenCard;
