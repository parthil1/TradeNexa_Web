import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { referenceApi } from "@/store/api/referenceApi";
import { wishlistApi } from "@/store/api/wishlistApi";
import filtersReducer from "@/store/slices/filtersSlice";
import uiReducer from "@/store/slices/uiSlice";

export function makeStore() {
  const store = configureStore({
    reducer: {
      [referenceApi.reducerPath]: referenceApi.reducer,
      [wishlistApi.reducerPath]: wishlistApi.reducer,
      filters: filtersReducer,
      ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(referenceApi.middleware, wishlistApi.middleware),
  });

  // Enables refetchOnReconnect for queries that opt in.
  setupListeners(store.dispatch);

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
