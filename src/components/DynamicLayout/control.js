import * as React from "react";
import { Button } from "../ui/button";
import { ExternalLink, Maximize2, Minimize2 } from "lucide-react";

const Icon = (props) => {
  return (
    <div title={props.title} className="action" onClick={props.onClick}>
      <span
        style={{ fontSize: "inherit" }}
        className="material-symbols-outlined"
      >
        {props.icon}
      </span>
    </div>
  );
};

const groupControlsComponents = {
  //   panel_1: () => {
  //     return <Icon icon="file_download" />;
  //   },
};

export const RightControls = (props) => {
  const Component = React.useMemo(() => {
    if (!props.isGroupActive || !props.activePanel) {
      return null;
    }

    return groupControlsComponents[props.activePanel.id];
  }, [props.isGroupActive, props.activePanel]);

  const [isMaximized, setIsMaximized] = React.useState(
    props.containerApi.hasMaximizedGroup()
  );

  const [isPopout, setIsPopout] = React.useState(
    props.api.location.type === "popout"
  );

  React.useEffect(() => {
    const disposable = props.containerApi.onDidMaximizedGroupChange(() => {
      setIsMaximized(props.containerApi.hasMaximizedGroup());
    });

    const disposable2 = props.api.onDidLocationChange(() => {
      setIsPopout(props.api.location.type === "popout");
    });

    return () => {
      disposable.dispose();
      disposable2.dispose();
    };
  }, [props.containerApi]);

  const onClick = () => {
    if (props.containerApi.hasMaximizedGroup()) {
      props.containerApi.exitMaximizedGroup();
    } else {
      props.activePanel?.api.maximize();
    }
  };

  const onClick2 = () => {
    if (props.api.location.type !== "popout") {
      props.containerApi.addPopoutGroup(props.group);
    } else {
      props.api.moveTo({ position: "right" });
    }
  };

  return (
    <div
      className="group-control"
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0px 8px",
        height: "100%",
        color: "var(--dv-activegroup-visiblepanel-tab-color)",
      }}
    >
      {/* {props.isGroupActive && <Icon icon="star" />} */}
      {Component && <Component />}

      <Button
        title={isPopout ? "Close Window" : "Open In New Window"}
        onClick={onClick2}
        variant="outline"
        size="icon"
      >
        {isPopout ? <Minimize2 /> : <ExternalLink />}
      </Button>
      {!isPopout && (
        <Button
          title={isMaximized ? "Minimize View" : "Maximize View"}
          onClick={onClick}
          variant="outline"
          size="icon"
        >
          {isMaximized ? <Minimize2 /> : <Maximize2 />}
        </Button>
      )}
    </div>
  );
};

// export const LeftControls = (props) => {
//   const onClick = () => {
//     props.containerApi.addPanel({
//       id: `id_${Date.now().toString()}`,
//       component: "default",
//       title: `Tab ${nextId()}`,
//       position: {
//         referenceGroup: props.group,
//       },
//     });
//   };

//   return (
//     <div
//       className="group-control"
//       style={{
//         display: "flex",
//         alignItems: "center",
//         padding: "0px 8px",
//         height: "100%",
//         color: "var(--dv-activegroup-visiblepanel-tab-color)",
//       }}
//     >
//       <Icon onClick={onClick} icon="add" />
//     </div>
//   );
// };
