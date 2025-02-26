// https://dev.to/askharley/build-a-react-redux-shopping-list-app-43l

export const NEW_LIST = '@selectedList/NEW_LIST'
export const ADD_TO_BASKET = '@selectedList/ADD_TO_BASKET'
export const ADDS_TO_BASKET = '@selectedList/ADDS_TO_BASKET'
export const REMOVE_ITEM = '@selectedList/REMOVE_ITEM'
export const REMOVE_ITEMS = '@selectedList/REMOVE_ITEMS'
export const CLEAR_ITEMS = '@selectedList/CLEAR_ITEMS'

export const actionCreators = {
    newList: data => ({ type: NEW_LIST, payload: data }),
    addToBasket: data => ({ type: ADD_TO_BASKET, payload: data }),
    addsToBasket: data => ({ type: ADDS_TO_BASKET, payload: data }),
    removeItem: data => ({ type: REMOVE_ITEM, payload: data }),
    removeItems: data => ({ type: REMOVE_ITEMS, payload: data }),
    clearItems: () => ({ type: CLEAR_ITEMS })
};