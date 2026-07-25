import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { isGeoCacheFresh, readGeoLastLocation } from "@/utils/geoLocationStorage";

export interface LocationFilterState {
  stateId: string;
  stateLabel: string;
  cityId: string;
  cityLabel: string;
  /** Set once the user edits filters manually, which stops geo auto-sync. */
  userTouched: boolean;
}

const initialState: LocationFilterState = {
  stateId: "",
  stateLabel: "",
  cityId: "",
  cityLabel: "",
  userTouched: false,
};

/**
 * Buyer-facing location filter, shared by every catalog surface
 * (products, categories, search, trending). Kept in Redux so switching pages
 * preserves the selection instead of resetting to empty and re-resolving geo.
 */
const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    /**
     * Seed from the geo localStorage cache before the first catalog fetch so
     * useLoadMoreList does not fire once with an empty city_id and again after
     * the geo effect lands.
     */
    hydrateFromGeoCache(state) {
      if (state.userTouched || state.cityId) return;
      const cached = readGeoLastLocation();
      if (!cached || !isGeoCacheFresh(cached)) return;
      state.stateId = String(cached.state_id);
      state.stateLabel = cached.state_name?.trim() || "";
      state.cityId = String(cached.city_id);
      state.cityLabel = cached.city_name?.trim() || "";
    },
    applyGeoLocation(
      state,
      action: PayloadAction<{
        stateId: string;
        stateLabel: string;
        cityId: string;
        cityLabel: string;
      }>
    ) {
      // Never override an explicit user choice with a geo result.
      if (state.userTouched) return;
      state.stateId = action.payload.stateId;
      state.stateLabel = action.payload.stateLabel;
      state.cityId = action.payload.cityId;
      state.cityLabel = action.payload.cityLabel;
    },
    setStateFilter(state, action: PayloadAction<{ stateId: string; label?: string }>) {
      state.userTouched = true;
      state.stateId = action.payload.stateId;
      state.stateLabel = action.payload.stateId ? action.payload.label?.trim() || "" : "";
      state.cityId = "";
      state.cityLabel = "";
    },
    setCityFilter(state, action: PayloadAction<{ cityId: string; label?: string }>) {
      state.userTouched = true;
      state.cityId = action.payload.cityId;
      state.cityLabel = action.payload.cityId ? action.payload.label?.trim() || "" : "";
    },
    clearCityFilter(state) {
      state.userTouched = true;
      state.cityId = "";
      state.cityLabel = "";
    },
    clearLocationFilters(state) {
      state.userTouched = true;
      state.stateId = "";
      state.stateLabel = "";
      state.cityId = "";
      state.cityLabel = "";
    },
  },
});

export const {
  hydrateFromGeoCache,
  applyGeoLocation,
  setStateFilter,
  setCityFilter,
  clearCityFilter,
  clearLocationFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;
