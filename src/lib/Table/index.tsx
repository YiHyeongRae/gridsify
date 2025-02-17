import { useEffect, useRef, useState } from "react";
import { every, map, orderBy, some, throttle, times } from "lodash";
import { TableTypes, TdObjTypes } from "../types";
import useTable from "../utlis/useTable";

function index({
  className = "",
  draggableIcon,
  data = [],
  addedMap = [[]],
  checkable = { active: false, multi: false, setter: () => {} },
  tdOptions = {},
  trOptions = {
    thead: { className: () => {}, func: () => {}, isDraggable: () => {} },
    tbody: { className: () => {}, func: () => {}, isDraggable: () => {} },
  },
  mergeTheadTrOptions,
  perPageOptions,
  perPageList = [20, 50, 100, 200],
  overflowY = { active: false, maxHeight: "" },
}: TableTypes) {
  const thMap = new Map([["no", "no"]]);

  const [tableThData, setTableThData] = useState(thMap);
  const [tableTdData, setTableTdData] = useState<TdObjTypes[]>([]);
  const [addedMapData, setAddedMapData] = useState(addedMap);

  const [tabelCkecked, setTableChecked] = useState<number[]>([]);

  const [orderByList, setOrderByList] = useState<"ASC" | "DESC">("DESC");
  const [currentOrderBy, setCurrentOrderBy] = useState("index");

  const [currentDrag, setCurrentDrag] = useState<"thead" | "tbody" | "">("");
  const [theadDrag, setTheadDrag] = useState({
    start: "",
    end: "",
    beforeChanged: "",
  });
  const [tbodyDrag, setTbodyDrag] = useState({
    start: 0,
    end: 0,
    beforeChanged: 0,
  });

  useEffect(() => {
    useTable.makeTableThData({
      addedMap: addedMapData,
      thMap,
      setter: setTableThData,
    });
    useTable.makeTableTdData({
      array: data,
      setter: setTableTdData,
      page: perPageOptions?.page || 1,
      perPage: perPageOptions?.perPage || perPageList[0],
      thMap,
    });
  }, [perPageOptions?.perPage, addedMapData, data]);

  const checkboxRef = useRef<null[] | HTMLDivElement[]>([]);

  useEffect(() => {
    setTableChecked([]);
  }, [checkable.active, checkable.multi]);

  useEffect(() => {
    setAddedMapData(addedMap);
  }, [data]);

  return (
    <div className={`flex flex-col h-full gridsify-root gap-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-end">
        {perPageOptions &&
          (perPageOptions?.el ? (
            perPageOptions?.el
          ) : (
            <select
              value={perPageOptions?.perPage}
              className="rounded-none gridsify-select join-item select-sm select select-bordered max-md:select-xs"
              onChange={(e) => {
                perPageOptions?.setPerPage(
                  (prev: { page: number; perPage: number }) => {
                    return {
                      ...prev,
                      page: 1,
                      perPage: Number(e.target.value),
                    };
                  }
                );
              }}
            >
              {map(perPageList, (item, index) => {
                return (
                  <option value={item} key={`perPage-${index}`}>
                    {`${item}`}
                  </option>
                );
              })}
            </select>
          ))}
      </div>
      <div
        className="overflow-auto gridsify-wrap"
        style={{
          maxHeight: overflowY.active ? overflowY.maxHeight : "",
        }}
      >
        <table
          className="table table-s max-md:table-xs gridsify-table"
          style={{ width: "100%" }}
        >
          <thead className="sticky top-0 left-0 z-50 border-none gridsify-thead">
            <tr
              className={` ${trOptions?.thead?.className?.()}`}
              onClick={() => trOptions?.thead?.func?.()}
            >
              {trOptions.tbody?.isDraggable?.(null, null) && (
                <th className=""></th>
              )}
              {checkable.active && (
                <th
                  className=""
                  rowSpan={
                    mergeTheadTrOptions?.colSpanTarget.length !== 0
                      ? 2
                      : undefined
                  }
                >
                  <label className="flex">
                    <input
                      disabled={!checkable.multi}
                      type="checkbox"
                      className="gridsify-checkbox checkbox max-md:checkbox-sm"
                      checked={
                        tabelCkecked.length > 0 &&
                        tabelCkecked.length === tableTdData.flat().length &&
                        every(tabelCkecked, (no) =>
                          some(tableTdData, (item) => no === item.no)
                        )
                      }
                      onChange={(e) => {
                        const tableChekced: number[] = [];

                        if (e.currentTarget.checked) {
                          map(tableTdData, (item) => {
                            tableChekced.push(item.no as number);
                          });
                        }
                        setTableChecked(tableChekced);
                        checkable.setter(tableChekced);
                      }}
                    />
                  </label>
                </th>
              )}

              {Array.from(tableThData.keys())?.map((item, index) => {
                return (
                  <th
                    rowSpan={
                      mergeTheadTrOptions?.colSpanTarget.includes(item)
                        ? undefined
                        : 2
                    }
                    colSpan={
                      mergeTheadTrOptions &&
                      item in mergeTheadTrOptions?.colSpanStarter
                        ? mergeTheadTrOptions?.colSpanStarter[item].colSpan
                        : undefined
                    }
                    className={`
                      border border-secondary
                      ${
                        mergeTheadTrOptions &&
                        !(item in mergeTheadTrOptions?.colSpanStarter) &&
                        mergeTheadTrOptions?.colSpanTarget.includes(item)
                          ? "hidden"
                          : ""
                      }`}
                    key={`${item}-${index}`}
                    draggable={
                      !mergeTheadTrOptions &&
                      trOptions?.thead?.isDraggable?.(item, index)
                    }
                    onDragStart={(e) => {
                      const selection = window.getSelection();

                      if (selection?.type === "Range") {
                        selection.removeAllRanges();
                      }
                      setCurrentDrag("thead");
                      const text = e.currentTarget.children[0]
                        .children[0] as HTMLElement;
                      setTheadDrag((prev) => {
                        return {
                          ...prev,
                          start: text.innerText,
                        };
                      });
                    }}
                    onDragEnter={(e) => {
                      if (currentDrag === "thead") {
                        const text = e.currentTarget.children[0]
                          .children[0] as HTMLElement;
                        setTheadDrag((prev) => {
                          return {
                            ...prev,
                            beforeChanged: text.innerText,
                          };
                        });
                        const throttledDrager = throttle(() => {
                          if (
                            theadDrag.start !== "no" &&
                            theadDrag.start !== "" &&
                            text.innerText !== "" &&
                            text.innerText !== "no" &&
                            theadDrag.beforeChanged !== text.innerText
                          ) {
                            const copy = [...addedMapData];
                            const startIndex = copy.findIndex((subArr) =>
                              subArr.includes(theadDrag.start)
                            );
                            const endIndex = copy.findIndex((subArr) =>
                              subArr.includes(text.innerText)
                            );

                            copy[startIndex] = addedMapData[endIndex];
                            copy[endIndex] = addedMapData[startIndex];

                            setAddedMapData(copy);
                          }
                        }, 3000);

                        throttledDrager();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDragEnd={() => {
                      setTheadDrag({ start: "", end: "", beforeChanged: "" });
                      setCurrentDrag("");
                    }}
                  >
                    <div
                      className={`flex items-center justify-center gap-2  ${
                        !mergeTheadTrOptions?.colSpanTarget.includes(item) &&
                        currentOrderBy === item
                          ? "text-primary"
                          : ""
                      }`}
                      onClick={() => {
                        if (
                          !mergeTheadTrOptions?.colSpanTarget.includes(item)
                        ) {
                          setOrderByList((prev) =>
                            prev === "ASC" ? "DESC" : "ASC"
                          );
                          setCurrentOrderBy(item);

                          const sorted = orderBy(
                            tableTdData,
                            [item],
                            [orderByList === "ASC" ? "asc" : "desc"]
                          );
                          setTableTdData(sorted);
                        }
                      }}
                    >
                      <div
                        className={`${
                          !mergeTheadTrOptions?.colSpanTarget.includes(item)
                            ? "cursor-pointer"
                            : ""
                        } text-base max-md:text-sm`}
                      >
                        {mergeTheadTrOptions &&
                        item in mergeTheadTrOptions?.colSpanStarter &&
                        mergeTheadTrOptions?.colSpanTarget.includes(item)
                          ? mergeTheadTrOptions?.colSpanStarter[item].title
                          : tableThData.get(item)}
                      </div>
                      {!mergeTheadTrOptions?.colSpanTarget.includes(item) && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                          stroke="currentColor"
                          className={`
                          ${
                            orderByList === "DESC" && currentOrderBy === item
                              ? "rotate-180"
                              : "rotate-0"
                          } size-3 
                          `}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
            <tr
              className={` ${trOptions?.thead?.className?.()} `}
              onClick={() => trOptions?.thead?.func?.()}
            >
              {mergeTheadTrOptions?.colSpanTarget.length === 0 && (
                <th className="">
                  <label className="flex">
                    <input
                      disabled={!checkable.multi}
                      type="checkbox"
                      className="gridsify-checkbox checkbox max-md:checkbox-sm"
                      checked={
                        tabelCkecked.length > 0 &&
                        tabelCkecked.length === tableTdData.flat().length
                      }
                      onChange={(e) => {
                        const tableChekced: number[] = [];

                        if (e.currentTarget.checked) {
                          map(tableTdData, (item) => {
                            tableChekced.push(item.no as number);
                          });
                        }
                        setTableChecked(tableChekced);
                        checkable.setter(tableChekced);
                      }}
                    />
                  </label>
                </th>
              )}

              {Array.from(tableThData.keys())?.map((item, index) => {
                return (
                  <th
                    rowSpan={
                      mergeTheadTrOptions?.colSpanTarget.length !== 0
                        ? 2
                        : undefined
                    }
                    className={`
                      border border-secondary
                     ${
                       !mergeTheadTrOptions?.colSpanTarget.includes(item)
                         ? "hidden"
                         : ""
                     }`}
                    key={`${item}-${index}`}
                    draggable={
                      !mergeTheadTrOptions &&
                      trOptions?.thead?.isDraggable?.(item, index)
                    }
                    onDragStart={(e) => {
                      const selection = window.getSelection();

                      if (selection?.type === "Range") {
                        selection.removeAllRanges();
                      }

                      setCurrentDrag("thead");
                      const text = e.currentTarget.children[0]
                        .children[0] as HTMLElement;
                      setTheadDrag((prev) => {
                        return {
                          ...prev,
                          start: text.innerText,
                        };
                      });
                    }}
                    onDragEnter={(e) => {
                      if (currentDrag === "thead") {
                        const text = e.currentTarget.children[0]
                          .children[0] as HTMLElement;
                        setTheadDrag((prev) => {
                          return {
                            ...prev,
                            beforeChanged: text.innerText,
                          };
                        });
                        const throttledDrager = throttle(() => {
                          if (
                            theadDrag.start !== "no" &&
                            theadDrag.start !== "" &&
                            text.innerText !== "" &&
                            text.innerText !== "no" &&
                            theadDrag.beforeChanged !== text.innerText
                          ) {
                            const copy = [...addedMapData];
                            const startIndex = copy.findIndex((subArr) =>
                              subArr.includes(theadDrag.start)
                            );
                            const endIndex = copy.findIndex((subArr) =>
                              subArr.includes(text.innerText)
                            );

                            copy[startIndex] = addedMapData[endIndex];
                            copy[endIndex] = addedMapData[startIndex];

                            setAddedMapData(copy);
                          }
                        }, 3000);

                        throttledDrager();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDragEnd={() => {
                      setTheadDrag({ start: "", end: "", beforeChanged: "" });
                      setCurrentDrag("");
                    }}
                  >
                    <div
                      className={`flex items-center justify-center gap-2 ${
                        currentOrderBy === item ? "text-primary" : ""
                      }`}
                      onClick={() => {
                        setOrderByList((prev) =>
                          prev === "ASC" ? "DESC" : "ASC"
                        );
                        setCurrentOrderBy(item);
                        const sorted = orderBy(
                          tableTdData,
                          [item],
                          [orderByList === "ASC" ? "asc" : "desc"]
                        );
                        setTableTdData(sorted);
                      }}
                    >
                      <div
                        className={`cursor-pointer text-base max-md:text-sm`}
                      >
                        {tableThData.get(item)}
                      </div>

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        stroke="currentColor"
                        className={`
                        ${
                          orderByList === "DESC" && currentOrderBy === item
                            ? "rotate-180"
                            : "rotate-0"
                        } size-3 
                        `}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
                        />
                      </svg>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="gridsify-tbody" draggable={false}>
            {tableTdData?.map((item, index) => {
              return (
                <tr
                  key={index}
                  className={`
                  ${trOptions?.tbody?.className?.(item, index)} ${
                    tabelCkecked.includes(item.no as number) ? "bg-primary" : ""
                  } `}
                  onClick={() => {
                    trOptions?.tbody?.func?.(item, index);
                  }}
                  onDoubleClick={() => {
                    trOptions?.tbody?.dbClickFunc?.(item, index);
                  }}
                  draggable={trOptions.tbody?.isDraggable?.(item, index)}
                  onDragStart={() => {
                    const selection = window.getSelection();

                    if (selection?.type === "Range") {
                      selection.removeAllRanges();
                    }

                    setCurrentDrag("tbody");
                    setTbodyDrag((prev) => {
                      return {
                        ...prev,
                        start: index,
                      };
                    });
                  }}
                  onDragEnter={() => {
                    if (currentDrag === "tbody") {
                      setTbodyDrag((prev) => {
                        return {
                          ...prev,
                          beforeChanged: index,
                        };
                      });

                      if (
                        tbodyDrag.beforeChanged !== index &&
                        item.isActive !== false
                      ) {
                        const copy = [...tableTdData];

                        copy[index] = tableTdData[tbodyDrag.start];
                        copy[tbodyDrag.start] = tableTdData[index];

                        setTableTdData(copy);
                        setTbodyDrag((prev) => {
                          return {
                            ...prev,
                            start: index,
                          };
                        });
                      }
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDragEnd={() => {
                    setCurrentDrag("");
                    trOptions.tbody?.dragEndFunc &&
                      trOptions.tbody?.dragEndFunc(tableTdData);
                  }}
                >
                  {trOptions.tbody?.isDraggable?.(item, index) && (
                    <td>
                      {draggableIcon ? (
                        draggableIcon
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                          />
                        </svg>
                      )}
                    </td>
                  )}
                  {checkable.active && (
                    <td className="bg-inherit">
                      <label className="flex">
                        <input
                          type="checkbox"
                          className="gridsify-checkbox checkbox max-md:checkbox-sm"
                          checked={tabelCkecked.includes(item.no as number)}
                          ref={(el) =>
                            (checkboxRef.current[item.no as number] = el)
                          }
                          onChange={(e) => {
                            const isChecekd = [...tabelCkecked];
                            if (e.currentTarget.checked) {
                              isChecekd.push(item.no as number);
                            } else {
                              const targetIndex = isChecekd.indexOf(
                                item.no as number
                              );
                              isChecekd.splice(targetIndex, 1);
                            }

                            if (!checkable.multi) {
                              if (e.currentTarget.checked) {
                                isChecekd.splice(0, 1);
                                isChecekd[0] = item.no as number;
                              } else {
                                isChecekd.splice(0, 1);
                              }
                            }
                            setTableChecked(isChecekd);
                            checkable.setter(isChecekd);
                          }}
                        />
                      </label>
                    </td>
                  )}

                  {map(item, (value, key) => {
                    return (
                      <td
                        id={`${key}-${index}`}
                        key={key}
                        className={`${
                          tdOptions[key]?.className?.(value, index, item) || ""
                        } ${key === "no" ? "" : ""}
                        `}
                        onClick={(e) => {
                          e.preventDefault();
                          tdOptions[key]?.func &&
                            tdOptions[key]?.func?.(value, index, item);
                          checkable.active &&
                            checkboxRef.current[item.no as number]?.click();
                        }}
                      >
                        <div
                          className={`flex whitespace-nowrap justify-center max-md:text-sm`}
                        >
                          {tdOptions[key]?.el
                            ? tdOptions[key]?.el?.(value, index, item)
                            : value}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {tableTdData.length === 0 && (
              <tr>
                <td
                  className="p-10 text-center border-none max-md:text-sm"
                  colSpan={9999}
                >
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {Math.ceil(perPageOptions?.pageLength || 0) > 1 && (
        <div className="flex justify-center">
          <div className="gridsify-pagination join">
            <button
              className="border-none join-item btn btn-ghost btn-outline btn-sm max-md:btn-xs"
              disabled={perPageOptions?.page === 1}
              onClick={() =>
                perPageOptions?.setPerPage((prev: { page: number }) => {
                  return { ...prev, page: prev.page - 1 };
                })
              }
            >
              &lt;
            </button>

            {times(Math.ceil(perPageOptions?.pageLength || 0), (item) => {
              const currentPage = perPageOptions?.page || 1;
              const startRange = Math.floor((currentPage - 1) / 10) * 10 + 1;
              const endRange = startRange + 9;

              return (
                <button
                  key={`page-${item}`}
                  className={`
                    ${
                      startRange <= item + 1 && item + 1 <= endRange
                        ? ""
                        : "hidden"
                    }
                    ${currentPage === item + 1 ? "bg-primary " : ""} 
                    join-item btn btn-outline border-none btn-sm max-md:btn-xs
                  `}
                  onClick={() =>
                    perPageOptions?.setPerPage((prev: { page: number }) => {
                      return { ...prev, page: item + 1 };
                    })
                  }
                >
                  {item + 1}
                </button>
              );
            })}
            <button
              className="border-none join-item btn btn-ghost btn-outline btn-sm max-md:btn-xs"
              disabled={
                Math.ceil(perPageOptions?.pageLength || 0) ===
                perPageOptions?.page
              }
              onClick={() =>
                perPageOptions?.setPerPage((prev: { page: number }) => {
                  return { ...prev, page: prev.page + 1 };
                })
              }
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default index;
