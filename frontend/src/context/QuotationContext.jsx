import React, { createContext, useContext, useReducer, useCallback } from 'react';

const QuotationContext = createContext();

// Action types
const ACTIONS = {
  ADD_HEADER: 'ADD_HEADER',
  REMOVE_HEADER: 'REMOVE_HEADER',
  ADD_SERVICE: 'ADD_SERVICE',
  REMOVE_SERVICE: 'REMOVE_SERVICE',
  ADD_SUB_SERVICE: 'ADD_SUB_SERVICE',
  REMOVE_SUB_SERVICE: 'REMOVE_SUB_SERVICE',
  UPDATE_CUSTOM_HEADER: 'UPDATE_CUSTOM_HEADER',
  CLEAR_SELECTIONS: 'CLEAR_SELECTIONS',
  RESET: 'RESET'
};

// Initial state
const initialState = {
  selectedHeaders: [],
  allSelectedSubServices: new Set()
};

// Reducer
function quotationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_HEADER: {
      const newSubServicesSet = new Set(state.allSelectedSubServices);
      action.payload.services?.forEach(s => s.subServices?.forEach(ss => newSubServicesSet.add(ss.id)));
      return {
        ...state,
        selectedHeaders: [...state.selectedHeaders, action.payload],
        allSelectedSubServices: newSubServicesSet
      };
    }

    case ACTIONS.REMOVE_HEADER: {
      const updatedHeaders = state.selectedHeaders.filter((_, idx) => idx !== action.payload);
      // rebuild subservice set
      const set = new Set();
      updatedHeaders.forEach(h => h.services?.forEach(s => s.subServices?.forEach(ss => set.add(ss.id))));
      return { ...state, selectedHeaders: updatedHeaders, allSelectedSubServices: set };
    }

    case ACTIONS.ADD_SERVICE: {
      const { headerIndex, service } = action.payload;
      const headers = [...state.selectedHeaders];
      const target = headers[headerIndex] || { services: [] };
      const currServices = target.services || [];
      headers[headerIndex] = { ...target, services: [...currServices, service] };

      const set = new Set(state.allSelectedSubServices);
      service.subServices?.forEach(ss => set.add(ss.id));

      return { ...state, selectedHeaders: headers, allSelectedSubServices: set };
    }

    case ACTIONS.REMOVE_SERVICE: {
      const { headerIndex, serviceId } = action.payload;
      const headers = [...state.selectedHeaders];
      const svc = headers[headerIndex].services.find(s => s.id === serviceId);
      headers[headerIndex].services = headers[headerIndex].services.filter(s => s.id !== serviceId);

      const set = new Set(state.allSelectedSubServices);
      svc?.subServices?.forEach(ss => set.delete(ss.id));
      return { ...state, selectedHeaders: headers, allSelectedSubServices: set };
    }

    case ACTIONS.ADD_SUB_SERVICE: {
      const { headerIndex, serviceId, subService } = action.payload;
      const headers = [...state.selectedHeaders];
      const svc = headers[headerIndex].services.find(s => s.id === serviceId);
      if (!svc) return state;
      const existing = svc.subServices || [];
      if (existing.some(x => x.id === subService.id)) return state;
      svc.subServices = [...existing, subService];
      const set = new Set(state.allSelectedSubServices);
      set.add(subService.id);
      return { ...state, selectedHeaders: headers, allSelectedSubServices: set };
    }

    case ACTIONS.REMOVE_SUB_SERVICE: {
      const { headerIndex, serviceId, subServiceId } = action.payload;
      const headers = [...state.selectedHeaders];
      const svc = headers[headerIndex].services.find(s => s.id === serviceId);
      if (!svc) return state;
      svc.subServices = (svc.subServices || []).filter(ss => ss.id !== subServiceId);

      // Rebuild global set (safer than conditionally deleting)
      const set = new Set();
      headers.forEach(h => h.services?.forEach(s => s.subServices?.forEach(ss => set.add(ss.id))));
      return { ...state, selectedHeaders: headers, allSelectedSubServices: set };
    }

    case ACTIONS.UPDATE_CUSTOM_HEADER: {
      const { headerIndex, customName } = action.payload;
      const headers = [...state.selectedHeaders];
      headers[headerIndex] = { ...headers[headerIndex], name: customName };
      return { ...state, selectedHeaders: headers };
    }

    case ACTIONS.CLEAR_SELECTIONS:
      return { ...state, selectedHeaders: [], allSelectedSubServices: new Set() };

    case ACTIONS.RESET:
      return initialState;

    default:
      return state;
  }
}

// Provider
export function QuotationProvider({ children }) {
  const [state, dispatch] = useReducer(quotationReducer, initialState);

  // Duplicate checker helpers
  const getSubServiceLocation = useCallback((subServiceId) => {
    for (let h = 0; h < state.selectedHeaders.length; h++) {
      const header = state.selectedHeaders[h];
      for (let s = 0; s < (header.services || []).length; s++) {
        const service = header.services[s];
        const sub = (service.subServices || []).find(x => x.id === subServiceId);
        if (sub) {
          return {
            headerName: header.name,
            serviceName: service.label,
            headerIndex: h,
            serviceIndex: s,
            addedAt: new Date().toLocaleString()
          };
        }
      }
    }
    return null;
  }, [state.selectedHeaders]);

  const duplicateChecker = {
    isSubServiceSelected: (id) => state.allSelectedSubServices.has(id),
    getSubServiceLocation
  };

  // Actions
  const addHeader = useCallback((header) => dispatch({ type: ACTIONS.ADD_HEADER, payload: header }), []);
  const removeHeader = useCallback((headerIndex) => dispatch({ type: ACTIONS.REMOVE_HEADER, payload: headerIndex }), []);
  const addService = useCallback((headerIndex, service) => dispatch({ type: ACTIONS.ADD_SERVICE, payload: { headerIndex, service } }), []);
  const removeService = useCallback((headerIndex, serviceId) => dispatch({ type: ACTIONS.REMOVE_SERVICE, payload: { headerIndex, serviceId } }), []);
  const addSubService = useCallback((headerIndex, serviceId, subService) => dispatch({ type: ACTIONS.ADD_SUB_SERVICE, payload: { headerIndex, serviceId, subService } }), []);
  const removeSubService = useCallback((headerIndex, serviceId, subServiceId) => dispatch({ type: ACTIONS.REMOVE_SUB_SERVICE, payload: { headerIndex, serviceId, subServiceId } }), []);
  const updateCustomHeader = useCallback((headerIndex, customName) => dispatch({ type: ACTIONS.UPDATE_CUSTOM_HEADER, payload: { headerIndex, customName } }), []);
  const clearSelections = useCallback(() => dispatch({ type: ACTIONS.CLEAR_SELECTIONS }), []);
  const reset = useCallback(() => dispatch({ type: ACTIONS.RESET }), []);

  const value = {
    ...state,
    duplicateChecker,
    addHeader,
    removeHeader,
    addService,
    removeService,
    addSubService,
    removeSubService,
    updateCustomHeader,
    clearSelections,
    reset
  };

  return <QuotationContext.Provider value={value}>{children}</QuotationContext.Provider>;
}

// Hook
export function useQuotation() {
  const ctx = useContext(QuotationContext);
  if (!ctx) throw new Error('useQuotation must be used within a QuotationProvider');
  return ctx;
}
