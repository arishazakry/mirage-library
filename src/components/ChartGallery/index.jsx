"use client";
import { useChartStore } from "@/store/chartstore";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import {
  Trash2Icon,
  EditIcon,
  XIcon,
  CheckIcon,
  FolderIcon,
  PlusIcon,
  Group,
  GitCompare,
} from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import HistogramDis from "../VizPanel/HistogramDis";
import { Badge } from "../ui/badge";
import { useSwipeable } from "react-swipeable";

export default function ChartGallery() {
  const {
    charts,
    removeChart,
    renameChart,
    groups,
    createGroup,
    addChartToGroup,
    clearComparison,
    comparisonCharts,
    addToComparison,
    removeChartFromGroup,
    renameGroup,
    deleteGroup,
  } = useChartStore();

  const { resolvedTheme } = useTheme();
  const [theme, setTheme] = useState({
    primaryColor: "#1D4ED8",
    textColor: "#000000",
    cardBg: "#FFFFFF",
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const rootStyles = getComputedStyle(document.documentElement);
      setTheme({
        primaryColor:
          rootStyles.getPropertyValue("--primary").trim() || "#1D4ED8",
        textColor:
          rootStyles.getPropertyValue("--text-primary").trim() || "#000000",
        cardBg:
          rootStyles.getPropertyValue("--background-card").trim() || "#FFFFFF",
        fontFamily:
          rootStyles.getPropertyValue("--font-family").trim() ||
          "Inter, sans-serif",
        fontSize: rootStyles.getPropertyValue("--font-size").trim() || "14px",
      });
    }
  }, [resolvedTheme]);

  const [searchQuery, setSearchQuery] = useState("");
  const [editingChartId, setEditingChartId] = useState(null);
  const [newChartName, setNewChartName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("root"); // For selecting group
  const [editingGroupName, setEditingGroupName] = useState(""); // Input for renaming group
  const [groupBeingRenamed, setGroupBeingRenamed] = useState(""); // Track which group is being renamed

  const handleSwipe = (groupName) => {
    if (
      window.confirm(
        `Are you sure you want to delete the group "${groupName}"?`
      )
    ) {
      deleteGroup(groupName); // Call the function to remove the group
    }
  };

  // Swipeable options for detecting swipe actions
  const swipeHandlers = useSwipeable({
    onSwipedLeft: (e) => {
      const groupName = e.target.getAttribute("data-groupname");
      if (groupName) handleSwipe(groupName); // Handle swipe left to delete
    },
  });
  // ✅ Filter charts by search query
  const filteredCharts = useMemo(
    () =>
      charts
        .filter((chart) =>
          chart.title?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter((chart) => {
          if (selectedGroup === "root") return true;
          return groups[selectedGroup]?.includes(chart.id);
        }),
    [charts, searchQuery, selectedGroup, groups]
  );

  const handleRenameChart = (chartId) => {
    if (newChartName.trim()) {
      renameChart(chartId, newChartName);
    }
    setEditingChartId(null);
    setNewChartName("");
  };

  const handleGroupNameChange = (groupName) => {
    setGroupBeingRenamed(groupName);
    setEditingGroupName(groupName);
  };

  const handleGroupNameSubmit = (oldGroupName) => {
    if (oldGroupName !== editingGroupName) {
      let newGroupName = editingGroupName.trim();

      // Check for duplicates and append number if needed
      let count = 1;
      while (groups[newGroupName]) {
        newGroupName = `${editingGroupName} (${count++})`;
      }

      renameGroup(oldGroupName, newGroupName); // Rename the group
    }
    setEditingGroupName(""); // Reset input field
    setGroupBeingRenamed(""); // Clear group being renamed
  };

  return (
    <div className="mx-auto p-4 space-y-6 flex flex-col min-h-dvh">
      <h1 className="text-3xl font-bold mb-6">Interactive Chart Gallery</h1>
      <ResizablePanelGroup
        direction="vertical"
        className=" w-full h-full grow rounded-lg border"
      >
        <ResizablePanel defaultSize={75}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30}>
              <div className="flex flex-col p-2">
                {/* ➕ Create Group */}
                <div className="flex gap-2">
                  <Input
                    placeholder="New Group Name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      createGroup(newGroupName);
                      setNewGroupName("");
                    }}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" /> Add Group
                  </Button>
                </div>

                {/* 🏷️ List of Groups */}
                <div className="space-y-2 mt-4">
                  {/* Root Group */}
                  <div
                    key="root"
                    className="p-3 cursor-pointer flex justify-between items-center hover:bg-primary-foreground rounded-md"
                    onClick={() => setSelectedGroup("root")}
                  >
                    ...
                    <Badge>{charts.length}</Badge>
                  </div>

                  {/* Other Groups */}
                  {Object.entries(groups).map(([groupName, chartIds]) => (
                    <div
                      key={groupName}
                      className={`p-3 cursor-pointer flex justify-between items-center hover:bg-primary-foreground rounded-md ${
                        selectedGroup === groupName ? "bg-card" : ""
                      }`}
                      data-groupname={groupName} // Add group name for swipe detection
                      {...swipeHandlers}
                      onClick={() => setSelectedGroup(groupName)}
                      onDoubleClick={() => handleGroupNameChange(groupName)} // Double-click to rename group
                    >
                      {groupBeingRenamed === groupName ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            value={editingGroupName}
                            onChange={(e) =>
                              setEditingGroupName(e.target.value)
                            }
                            className="text-sm flex-grow"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleGroupNameSubmit(groupName)}
                          >
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingGroupName("");
                              setGroupBeingRenamed("");
                            }}
                          >
                            <XIcon className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="min-w-10 hover:cursor-text">
                            {groupName}
                          </span>
                          <Badge>{chartIds.length}</Badge>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={70}>
              <div className="flex flex-col h-full p-2">
                {/* 🔍 Search Bar */}
                <Input
                  placeholder="Search charts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />

                {/* 🖼️ Chart Gallery */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredCharts.length === 0 ? (
                    <p className="text-gray-500">No matching charts.</p>
                  ) : (
                    filteredCharts.map((chart) => (
                      <Card
                        key={chart.id}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <CardHeader className="flex items-center justify-between">
                          {editingChartId === chart.id ? (
                            <div className="flex gap-2 items-center w-full">
                              <Input
                                value={newChartName}
                                onChange={(e) =>
                                  setNewChartName(e.target.value)
                                }
                                placeholder={chart.title}
                                className="text-sm flex-grow"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRenameChart(chart.id)}
                              >
                                <CheckIcon className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingChartId(null);
                                  setNewChartName("");
                                }}
                              >
                                <XIcon className="h-4 w-4 text-gray-500" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center w-full">
                              <CardTitle className="text-sm">
                                {chart.title || "Unnamed Chart"}
                              </CardTitle>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingChartId(chart.id)}
                                >
                                  <EditIcon className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeChart(chart.id)}
                                >
                                  <Trash2Icon className="h-4 w-4 text-red-500" />
                                </Button>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <FolderIcon className="h-4 w-4 text-gray-500" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-56 p-2">
                                    <Command>
                                      <CommandInput placeholder="Search groups..." />
                                      <CommandList>
                                        {Object.keys(groups).map(
                                          (groupName) => (
                                            <CommandItem
                                              key={groupName}
                                              onSelect={() =>
                                                addChartToGroup(
                                                  groupName,
                                                  chart.id
                                                )
                                              }
                                            >
                                              {groupName}
                                            </CommandItem>
                                          )
                                        )}
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => addToComparison(chart)}
                                >
                                  <GitCompare className="h-4 w-4 " />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          {/* 📊 Chart Preview */}
                          <div className="w-full aspect-[2/1]">
                            {chart.type === "histogram" && (
                              <HistogramDis
                                name={chart.title}
                                data={chart.data}
                                theme={theme}
                                config={{ staticPlot: true }}
                              />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Created: {chart.createdAt}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={25}>
          <div className="p-2 h-full">
            {comparisonCharts.length > 0 && (
              <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-center gap-2">
                  <CardTitle>Chart Comparison</CardTitle>
                  <Button variant="destructive" onClick={clearComparison}>
                    Clear Comparison
                  </Button>
                </CardHeader>
                <CardContent className="grow">
                  <div className=" grid grid-row-1 h-full">
                    <div className="grid grid-cols-2 gap-4 items-center justify-center relative">
                      {comparisonCharts.map((chart, index) => (
                        <div
                          className="h-full flex flex-col items-center"
                          key={index}
                        >
                          <span>{chart.title || "Unnamed Chart"}</span>
                          <div className="h-full aspect-[2/1] grow">
                            {chart.type === "histogram" && (
                              <HistogramDis
                                name={chart.title}
                                data={chart.data}
                                theme={theme}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
