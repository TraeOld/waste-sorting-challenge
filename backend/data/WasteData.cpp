#include "data/WasteData.h"

#include <set>

namespace WasteData {
namespace {

const std::vector<WasteItem> kItems = {
    // Recyclable Waste (1-6)
    {1, "Plastic Bottle", "recyclable", "plastic_bottle",
     "Empty plastic bottles can become new plastic products."},
    {2, "Newspaper", "recyclable", "newspaper",
     "Keep newspapers clean and dry for paper recycling."},
    {3, "Cardboard Box", "recyclable", "cardboard_box",
     "Flatten clean cardboard boxes to save collection space."},
    {4, "Aluminium Can", "recyclable", "aluminium_can",
     "Empty aluminium cans can be recycled into new metal products."},
    {5, "Glass Bottle", "recyclable", "glass_bottle",
     "Empty glass bottles can be recycled where glass is collected."},
    {6, "Clean Paper Bag", "recyclable", "paper_bag",
     "Reuse clean paper bags before recycling them."},

    // Kitchen Waste (7-12)
    {7, "Banana Peel", "kitchen", "banana_peel",
     "Banana peels belong with food scraps in this game."},
    {8, "Apple Core", "kitchen", "apple_core",
     "Apple cores can join food scraps for organic waste processing."},
    {9, "Vegetable Leaves", "kitchen", "vegetable_leaves",
     "Keep vegetable scraps separate from packaging."},
    {10, "Eggshell", "kitchen", "eggshell",
     "Eggshells belong with kitchen waste in this game."},
    {11, "Leftover Rice", "kitchen", "leftover_rice",
     "Plan portions to reduce leftover food."},
    {12, "Tea Leaves", "kitchen", "tea_leaves",
     "Separate loose tea leaves from wrappers and other packaging."},

    // Hazardous Waste (13-18)
    {13, "Button Battery", "hazardous", "button_battery",
     "Batteries should be collected separately because they may contain harmful materials."},
    {14, "Rechargeable Battery", "hazardous", "rechargeable_battery",
     "Take rechargeable batteries to a suitable battery collection point."},
    {15, "Expired Medicine", "hazardous", "expired_medicine",
     "Use a local medicine collection service where available."},
    {16, "Mercury Thermometer", "hazardous", "mercury_thermometer",
     "Mercury thermometers need separate specialist collection."},
    {17, "Fluorescent Lamp", "hazardous", "fluorescent_lamp",
     "Fluorescent lamps need separate collection because they contain mercury."},
    {18, "Pesticide Container", "hazardous", "pesticide_container",
     "Pesticide containers may retain residues and need designated collection."},

    // Other Waste (19-24)
    {19, "Used Tissue", "other", "used_tissue",
     "Used tissues belong to other waste in this game."},
    {20, "Ceramic Pieces", "other", "ceramic_pieces",
     "Ceramics should not be mixed with glass bottle recycling."},
    {21, "Cigarette Butt", "other", "cigarette_butt",
     "Keep cigarette butts out of streets and waterways."},
    {22, "Dust", "other", "dust",
     "Household sweepings belong to other waste in this game."},
    {23, "Disposable Diaper", "other", "diaper",
     "Used disposable diapers belong to other waste in this game."},
    {24, "Dirty Plastic Bag", "other", "dirty_plastic_bag",
     "A heavily soiled plastic bag belongs to other waste in this game."},
};

}  // namespace

const std::vector<WasteItem>& allItems() { return kItems; }

bool isValid() {
    if (kItems.size() != 24) return false;

    std::set<int> ids;
    std::set<std::string> imageKeys;
    int perCategory[4] = {0, 0, 0, 0};

    for (const WasteItem& item : kItems) {
        if (item.id < 1 || item.id > 24) return false;
        if (item.name.empty() || item.category.empty() || item.imageKey.empty() ||
            item.ecoTip.empty()) {
            return false;
        }
        if (!ids.insert(item.id).second) return false;
        if (!imageKeys.insert(item.imageKey).second) return false;

        if (item.category == "recyclable") {
            ++perCategory[0];
        } else if (item.category == "kitchen") {
            ++perCategory[1];
        } else if (item.category == "hazardous") {
            ++perCategory[2];
        } else if (item.category == "other") {
            ++perCategory[3];
        } else {
            return false;
        }
    }

    for (int count : perCategory) {
        if (count != 6) return false;
    }
    return true;
}

}  // namespace WasteData
