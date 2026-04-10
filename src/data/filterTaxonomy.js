export const FILTER_TAXONOMY = {
  Apartment: {
    label: "Apartment / Flat",
    subFilters: [
      {
        key: "bhk",
        label: "Configuration",
        options: ["Studio", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "4+ BHK"]
      },
      {
        key: "furnished",
        label: "Furnishing",
        options: ["Unfurnished", "Semi-Furnished", "Fully Furnished"]
      },
      {
        key: "floor",
        label: "Floor",
        options: ["Ground", "Low (1–4)", "Mid (5–10)", "High (11+)", "Penthouse"]
      }
    ]
  },
  Villa: {
    label: "Villa / Independent House",
    subFilters: [
      {
        key: "bhk",
        label: "Bedrooms",
        options: ["2 BHK", "3 BHK", "4 BHK", "5 BHK", "5+ BHK"]
      },
      {
        key: "plotSize",
        label: "Plot Size",
        options: ["Under 1000 sqft", "1000–2000 sqft", "2000–4000 sqft", "4000+ sqft"]
      },
      {
        key: "villaType",
        label: "Villa Type",
        options: ["Standalone Villa", "Gated Community", "Farmhouse", "Duplex Villa"]
      }
    ]
  },
  Commercial: {
    label: "Commercial Space",
    subFilters: [
      {
        key: "commercialType",
        label: "Space Type",
        options: ["Office Space", "Retail / Shop", "Showroom", "Warehouse", "Co-working", "Restaurant Space"]
      },
      {
        key: "builtupArea",
        label: "Built-up Area",
        options: ["Under 500 sqft", "500–1000 sqft", "1000–2500 sqft", "2500+ sqft"]
      }
    ]
  },
  Plot: {
    label: "Plots & Land",
    subFilters: [
      {
        key: "plotType",
        label: "Plot Type",
        options: ["Residential Plot", "Commercial Plot", "Agricultural Land", "Industrial Land"]
      },
      {
        key: "plotArea",
        label: "Plot Area",
        options: ["Under 500 sqft", "500–1000 sqft", "1000–2500 sqft", "2500–5000 sqft", "5000+ sqft"]
      }
    ]
  },
  Penthouse: {
    label: "Penthouse",
    subFilters: [
      {
        key: "bhk",
        label: "Bedrooms",
        options: ["2 BHK", "3 BHK", "4 BHK", "5+ BHK"]
      },
      {
        key: "furnished",
        label: "Furnishing",
        options: ["Unfurnished", "Semi-Furnished", "Fully Furnished"]
      }
    ]
  }
};
