import * as actionTypes from "./actions/selectedList";
const initialState = {
  items: new Map(),
  currentList: [],
};

export default (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.CLEAR_ITEMS:
      return {
        ...state,
        items: new Map(),
      };
    case actionTypes.ADD_TO_BASKET:
      return {
        ...state,
        ...updateObjectInMap(state.items, state.currentList, action.payload),
      };
    case actionTypes.ADDS_TO_BASKET:
      return {
        ...state,
        ...updateObjectsInMap(state.items, state.currentList, action.payload),
      };
    case actionTypes.REMOVE_ITEM:
      return {
        ...state,
        ...removeItem(state.items, state.currentList, action.payload),
      };
    case actionTypes.REMOVE_ITEMS:
      return {
        ...state,
        ...removeItems(state.items, state.currentList, action.payload),
      };
    case actionTypes.NEW_LIST:
      return {
        ...state,
        currentList: initList(state.items, action),
      };
    default:
      return state;
  }
};
function initList(arrayMap, action) {
  return action.payload.map((d) => {
    return { ...d, inBasket: arrayMap.has(d.event_ma_id) };
  });
}
function updateObjectInMap(arrayMap, _array, action) {
  const array = [..._array];
  if (!arrayMap.has(action.event_ma_id)) {
    arrayMap.set(action.event_ma_id, { ...action });
    const i = array.findIndex((d) => d.event_ma_id === action.event_ma_id);
    if (i > -1) array[i] = { ...action, inBasket: true };
  }
  return {
    items: arrayMap,
    currentList: array,
  };
}

function updateObjectsInMap(arrayMap, _array, actions) {
  const array = [..._array];
  actions.forEach((action) => {
    if (!arrayMap.has(action.event_ma_id)) {
      arrayMap.set(action.event_ma_id, { ...action });
      const i = array.findIndex((d) => d.event_ma_id === action.event_ma_id);
      if (i > -1) array[i] = { ...action, inBasket: true };
    }
  });
  return {
    items: arrayMap,
    currentList: array,
  };
}
function removeItem(arrayMap, _array, action) {
  if (arrayMap.has(action.event_ma_id)) {
    const array = [..._array];
    arrayMap.delete(action.event_ma_id);
    const i = array.findIndex((d) => d.event_ma_id === action.event_ma_id);
    if (i > -1) array[i] = { ...action, inBasket: true };
    return {
      items: arrayMap,
      currentList: array,
    };
  } else {
    return {
      items: arrayMap,
      currentList: _array,
    };
  }
}
function removeItems(arrayMap, _array, actions) {
  const array = [..._array];
  actions.forEach((action) => {
    if (arrayMap.has(action.event_ma_id)) {
      arrayMap.delete(action.event_ma_id);
      const i = array.findIndex((d) => d.event_ma_id === action.event_ma_id);
      if (i > -1) array[i] = { ...action, inBasket: false };
    }
  });
  return {
    items: arrayMap,
    currentList: array,
  };
}
