#pragma once

#include <string>

// One entry of the waste database (spec V1.0, section 3).
struct WasteItem {
    int id = 0;
    std::string name;      // interface name, English
    std::string category;  // recyclable | kitchen | hazardous | other
    std::string imageKey;  // lower snake_case, no directory or extension
    std::string ecoTip;    // one English tip, shown after the answer
};

