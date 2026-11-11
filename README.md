# AlloCat — Resource & Capacity Planner

**AlloCat** is an interactive annual resource allocation and capacity planning application designed for engineering, product, design, and delivery teams. It provides a unified 12-month matrix workspace to plan team staffing across clients and deliverable projects, track time off and leaves, identify available bench capacity, and prevent overtime conflicts in real time.

**Live Application:** [https://ictismylife-dev.github.io/AlloCat/](https://ictismylife-dev.github.io/AlloCat/)

---

## Authentication & Access

Before signing in, the entire workspace view is blurred and locked behind a sign-in modal.

- **Default Login:** `admin`
- **Default Password:** `admin`
- **Session Lock / Logout:** Once signed in, click the user logout button (`admin`) in the top-right header bar to lock and blur the workspace again at any time.

---

## Core Views & Perspectives

AlloCat lets you inspect and edit your organization's staffing plan from four synchronized perspectives, with a pinned header and KPI/filter toolbar so only the matrix table scrolls:

1. **By People (`PeopleMatrixView`)**
   - Displays every team member in **`Last Name, First Name`** format alongside their employment type badge (`Internal`, `External`, `B2B`), annual average utilization, and monthly capacity totals (`Jan` – `Dec`).
   - Expand any person's row to view and edit their individual project allocations month by month.
   - Click any monthly summary cell or project cell to open the **Total Workload & Allocation Popover**, showing an itemized breakdown of where that person is allocated, a visual multi-segment capacity bar, active leave reductions, and quick project switching.

2. **By Clients & Projects (`ClientProjectMatrixView`)**
   - Groups all deliverable projects under their respective client organizations.
   - Tracks monthly total project staffing (`%` and `FTE` equivalents) and headcount assigned to each initiative.
   - Expand any project to manage the specific team members assigned to it and adjust their monthly allocation percentages.

3. **Availability & Leaves (`AvailabilityMatrixView`)**
   - Tracks scheduled vacations, PTO, sick leave, parental leave, and sabbaticals across the 12-month timeline.
   - Automatically calculates each person's **effective monthly capacity** (`Base Capacity − Leave Impact`) and flags months where project bookings exceed reduced availability.

4. **Bench (`BenchMatrixView`)**
   - Highlights unallocated working capacity (`Effective Capacity − Booked Projects`) for every team member each month.
   - Includes a quick capacity filter (e.g., `≥ 10%`, `≥ 20%`, `≥ 50%`, or `100% free`) so resource managers can immediately find available staff and assign them to new projects with one click.

---

## Key Features

- **Team Member & Company/Project Management**:
  - Split **First Name** and **Last Name** fields with **`Last Name, First Name`** table presentation.
  - **Employment Classification**: Track and filter staff by `Internal`, `External`, or `B2B` (editable both in the person modal and inline from any table row).
  - **Full Editing Support**: Edit existing people, client companies, and deliverable projects directly from any view.
- **Alphabetical Sorting**:
  - One-click **`A–Z` / `Z–A`** sort toggles in the sticky table headers and toolbar.
  - Sort people by **Last Name (`A → Z` / `Z → A`)** or **First Name (`A → Z` / `Z → A`)**, and sort **Clients** or **Projects** alphabetically (`A → Z` / `Z → A`).
- **Real-Time Overtime & Conflict Detection**: Automatically flags over-allocated person-months and provides a dedicated **Overtime Alerts Drawer** with one-click **Auto-Cap** balancing.
- **Interactive Cell Popover & Batch Assignment**: Adjust allocations via slider or presets (`0%`, `25%`, `50%`, `75%`, `100%`) and apply changes to a single month, the remainder of the year, or all 12 months.
- **Inline Comments & Staffing Notes**: Add and edit inline comments directly between names and monthly columns for people, projects, assignments, and leaves.
- **Multi-Year & Department Management**:
  - Add, switch, or remove planning years (`2025`, `2026`, `2027`, etc.) on the fly.
  - Create, rename, or remove departments with automatic updates across all team members.
- **Comprehensive Import, Export & Pre-Built CSV Templates**:
  - **Tab-Specific & All-Tabs CSV Export / Import**: Export or import `.csv` spreadsheets for `By People`, `By Clients & Projects`, `Availability & Leaves`, `Bench`, or all views.
  - **Downloadable Empty/Example CSV Templates**: Download ready-to-fill `.csv` templates directly from the Import modal.
  - **Full JSON Backup & Standalone HTML App**: Export the entire workspace state to `.json` or bundle the app into a portable single-file `.html` application.
- **Dark & Light Mode**: Defaults to **Dark Mode**, with a balanced soft-gray **Light Mode** toggle in the header.
