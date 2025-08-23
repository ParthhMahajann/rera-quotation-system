/**
 * Duplicate Prevention Utility for Quotation System
 * Prevents selecting the same sub-service across different headers and services
 */

export class DuplicateChecker {
  constructor() {
    this.selectedSubServices = new Set();
    this.subServiceLocations = new Map(); // subServiceId -> location info
  }

  /**
   * Check if a sub-service is already selected anywhere
   * @param {string} subServiceId - The ID of the sub-service to check
   * @returns {boolean} - True if already selected
   */
  isSubServiceSelected(subServiceId) {
    return this.selectedSubServices.has(subServiceId);
  }

  /**
   * Get the location where a sub-service was previously selected
   * @param {string} subServiceId - The ID of the sub-service
   * @returns {Object|null} - Location info or null if not found
   */
  getSubServiceLocation(subServiceId) {
    return this.subServiceLocations.get(subServiceId) || null;
  }

  /**
   * Add a sub-service to the tracking system
   * @param {string} subServiceId - The ID of the sub-service
   * @param {Object} location - Location information
   * @param {string} location.headerName - Name of the header
   * @param {string} location.serviceName - Name of the service
   * @param {number} location.headerIndex - Index of the header
   * @param {number} location.serviceIndex - Index of the service
   */
  addSubService(subServiceId, location) {
    this.selectedSubServices.add(subServiceId);
    this.subServiceLocations.set(subServiceId, {
      ...location,
      addedAt: new Date().toLocaleString()
    });
  }

  /**
   * Remove a sub-service from the tracking system
   * @param {string} subServiceId - The ID of the sub-service to remove
   */
  removeSubService(subServiceId) {
    this.selectedSubServices.delete(subServiceId);
    this.subServiceLocations.delete(subServiceId);
  }

  /**
   * Get all available sub-services with their availability status
   * @param {Array} allSubServices - Array of all sub-services to check
   * @returns {Array} - Array with availability status added
   */
  getAvailableSubServices(allSubServices) {
    return allSubServices.map(subService => {
      const isAlreadySelected = this.isSubServiceSelected(subService.id);
      const conflictLocation = isAlreadySelected ? 
        this.getSubServiceLocation(subService.id) : null;

      return {
        ...subService,
        isAlreadySelected,
        conflictLocation,
        isAvailable: !isAlreadySelected
      };
    });
  }

  /**
   * Clear all tracked sub-services
   */
  clear() {
    this.selectedSubServices.clear();
    this.subServiceLocations.clear();
  }

  /**
   * Get count of selected sub-services
   * @returns {number} - Count of selected sub-services
   */
  getSelectedCount() {
    return this.selectedSubServices.size;
  }

  /**
   * Get all selected sub-service IDs
   * @returns {Array} - Array of selected sub-service IDs
   */
  getSelectedIds() {
    return Array.from(this.selectedSubServices);
  }

  /**
   * Check if there are any conflicts in the current selection
   * @param {Array} newSubServices - New sub-services to check
   * @returns {Object} - Conflict information
   */
  checkConflicts(newSubServices) {
    const conflicts = [];
    
    newSubServices.forEach(subService => {
      if (this.isSubServiceSelected(subService.id)) {
        conflicts.push({
          subService,
          location: this.getSubServiceLocation(subService.id)
        });
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }
}

/**
 * Create a new instance of DuplicateChecker
 * @returns {DuplicateChecker} - New duplicate checker instance
 */
export function createDuplicateChecker() {
  return new DuplicateChecker();
}

/**
 * Utility function to format conflict message
 * @param {Object} conflict - Conflict information
 * @returns {string} - Formatted conflict message
 */
export function formatConflictMessage(conflict) {
  const { subService, location } = conflict;
  return `"${subService.text || subService.name}" is already selected in "${location.headerName}" → "${location.serviceName}"`;
}

/**
 * Utility function to get conflict details for display
 * @param {Object} conflict - Conflict information
 * @returns {Object} - Formatted conflict details
 */
export function getConflictDetails(conflict) {
  const { subService, location } = conflict;
  return {
    subServiceName: subService.text || subService.name,
    headerName: location.headerName,
    serviceName: location.serviceName,
    addedAt: location.addedAt,
    message: formatConflictMessage(conflict)
  };
}
