#pragma once

#include <vector>

#include "model/WasteItem.h"

namespace WasteData {

// The 24 official items from the specification, in ID order 1-24.
const std::vector<WasteItem>& allItems();

// Returns true when the database satisfies the rules in section 3:
// 24 items, IDs 1-24, unique IDs and image keys, four categories with six
// items each, and no empty field.
bool isValid();

}  // namespace WasteData
