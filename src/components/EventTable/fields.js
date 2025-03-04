import moment from "moment/moment";
import { Checkbox } from "@mui/material";
import EventOutIcon from "@mui/icons-material/ShoppingCartCheckout";
import EventIcon from "@mui/icons-material/ShoppingCart";
export const fields = [
  {
    id: "inBasket",
    header: "Selected",
    accessorKey: "inBasket",
    // size: 50,
    Cell: ({ renderedCellValue, row }) => (
      <Checkbox
        disabled
        size={"small"}
        icon={<EventOutIcon />}
        checkedIcon={<EventIcon color={"secondary"} />}
        checked={row.original.inBasket}
      />
    ),
    size: 50,
    minSize: 50,
    filterDisable: true,
  },
  {
    accessorKey: "location_rg_city",
    header: "City",
  },
  {
    accessorKey: "location_rg_country",
    header: "Country",
  },
  {
    accessorKey: "station_rg_name",
    header: "Station",
    filterDisable: true,
  },
  {
    accessorKey: "station_ar_genre",
    header: "Station Genre",
    Cell: ({ renderedCellValue, row }) => (
      <>{(renderedCellValue ?? []).join(", ")}</>
    ),
  },
  {
    accessorKey: "artist_sp_name",
    header: "Artist",
    cat: "artist",
    dynamic: true,
  },
  {
    accessorKey: "track_sp_name",
    header: "Event",
    dynamic: true,
  },
  // ,
  // {
  //     accessorKey: 'Event_MA_TimeStation',
  //     header: 'Time',
  //     type:'time',
  //     filterDisable:true,
  //     accessorFn:(d)=>d.Event_MA_TimeStation?moment(d.Event_MA_TimeStation).format('LLL'):''
  // }
];
export const fieldsWithoutSelected = fields.filter((d, i) => i);
export const filterSearch = [
  ...fields.filter((f) => !f.filterDisable),
  {
    accessorKey: "artist_wd_country",
    header: "Artist Country ",
    cat: "artist",
    dynamic: true,
  },
  {
    accessorKey: "artist_sp_genre",
    header: "Artist Genre ",
    cat: "artist",
    dynamic: true,
  },
  {
    accessorKey: "artist_wd_genders",
    header: "Artist Gender",
    cat: "artist",
    dynamic: true,
  },
  {
    accessorKey: "artist_wd_sexualorientations",
    header: "Artist Sexualorientations ",
    cat: "artist",
    dynamic: true,
  },
  {
    accessorKey: "artist_wd_ethnicities",
    header: "Artist Ethnicities ",
    cat: "artist",
    dynamic: true,
  },
];
