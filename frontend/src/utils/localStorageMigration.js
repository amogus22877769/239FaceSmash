/**
 * Migration utility for updating localStorage from old format to new format
 * 
 * Old format:
 * - selectedClass: "5", "6", "7", "8", "9", "10", "11" (class numbers)
 * 
 * New format:
 * - selectedClass: "false" (Младшие классы, classes 5-8), "true" (Старшие классы, classes 9-11), or "" (Все классы)
 */

const STORAGE_VERSION_KEY = "appStorageVersion";
const CURRENT_STORAGE_VERSION = "2";

/**
 * Migrates localStorage from old format to new format
 */
export function migrateLocalStorage() {
    const currentVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    
    // If already on current version, no migration needed
    if (currentVersion === CURRENT_STORAGE_VERSION) {
        return;
    }
    
    console.log("Running localStorage migration...");
    
    // Migrate selectedClass from old format (class numbers) to new format (oldSchool boolean)
    const selectedClass = localStorage.getItem("selectedClass");
    
    if (selectedClass) {
        // Check if it's a number (old format)
        const classNumber = parseInt(selectedClass, 10);
        
        if (!isNaN(classNumber)) {
            // Old format: convert class number to new format
            if (classNumber >= 5 && classNumber <= 8) {
                // Младшие классы (Junior classes)
                localStorage.setItem("selectedClass", "false");
                console.log(`Migrated selectedClass from "${selectedClass}" to "false" (Младшие классы)`);
            } else if (classNumber >= 9 && classNumber <= 11) {
                // Старшие классы (Senior classes)
                localStorage.setItem("selectedClass", "true");
                console.log(`Migrated selectedClass from "${selectedClass}" to "true" (Старшие классы)`);
            } else {
                // Invalid class number, clear it
                localStorage.removeItem("selectedClass");
                console.log(`Removed invalid selectedClass: "${selectedClass}"`);
            }
        }
        // If it's already "false", "true", or "", it's already in the new format
    }
    
    // Update storage version
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION);
    console.log("LocalStorage migration completed");
}

/**
 * Clears all app-related localStorage (useful for testing or reset)
 */
export function clearAppLocalStorage() {
    localStorage.removeItem("onlyWithPhoto");
    localStorage.removeItem("selectedClass");
    localStorage.removeItem(STORAGE_VERSION_KEY);
}

