# AlloCat — Resource & Capacity Planner

**AlloCat** is an interactive annual resource allocation and capacity planning application designed for engineering, product, design, and delivery teams. It provides a unified 12-month matrix workspace to plan team staffing across clients and deliverable projects, track time off and leaves, identify available bench capacity, and prevent overtime conflicts in real time.

**Live Application:** [https://ictismylife-dev.github.io/AlloCat/](https://ictismylife-dev.github.io/AlloCat/)

---

## Authentication, Logo Menu & Admin Control Panel

Before signing in, the entire workspace view is blurred and locked behind a sign-in modal.

- **Default Login:** `admin`
- **Default Password:** `admin`
- **Logo Button Menu & Admin Control Panel**: Once signed in, click the **AlloCat logo button** (top-left header, displaying the active username badge) to open the administrator dropdown menu:
  - **Open Admin Panel (`Manage All`)**: Launches the centralized **Admin Control Panel** modal with six dedicated tabs and Quick Jump shortcuts:
    1. **People & Team**: Search and browse all team members (sorted `A → Z`), inspect roles, departments, contract types (`Internal`, `External`, `B2B`), and max capacity, or add, edit, and remove team members.
    2. **Departments**: Create new organizational departments, inline-rename existing departments (automatically updating assigned team members), and remove empty departments.
    3. **Clients**: Search client organizations, create new client companies directly with status (`Active`, `Lead`, `Completed`), industry, and brand color, or edit and delete clients along with their associated projects.
    4. **Projects**: Search deliverable projects, view project codes, parent clients, billing status (`Billable` vs `Internal`), and assigned headcount for the active year, or add, edit, and delete projects.
    5. **Time Off & Leaves**: View all scheduled leaves across team members and years, schedule new time off, or delete existing leave entries.
    6. **Years & System**: Add/switch/remove planning years, change administrator login credentials, open Import/Export backup tools, or reset the workspace to default demo data.
  - **Change Login & Password**: Verify your current password and set a custom login and password (persisted in `localStorage`), or reset back to the default `admin:admin`.
  - **Log Out / Lock Workspace**: Immediately lock and blur the workspace view until signed in again.

---

## Core Views & Perspectives

AlloCat lets you inspect and edit your organization's staffing plan from four synchronized perspectives, with a pinned header and KPI/filter toolbar so only the matrix table scrolls:

1. **By Clients & Projects (`ClientProjectMatrixView` — First & Default View)**
   - Opens by default with all deliverable projects **expanded** under their respective client organizations, sorted alphabetically **`A → Z`**.
   - Tracks monthly total project staffing (`%` and `FTE` equivalents) and headcount assigned to each initiative.
   - Manage the specific team members assigned to each project and adjust their monthly allocation percentages directly.

2. **By People (`PeopleMatrixView`)**
   - Displays every team member in **`Last Name, First Name`** format (sorted **`A → Z`** by Last Name by default, with rows collapsed by default for a clean executive overview) alongside their employment type badge (`Internal`, `External`, `B2B`), annual average utilization, and monthly capacity totals (`Jan` – `Dec`).
   - Expand any person's row (or click **Expand All Rows**) to view and edit their individual project allocations month by month.
   - Click any monthly summary cell or project cell to open the **Total Workload & Allocation Popover**, showing an itemized breakdown of where that person is allocated, a visual multi-segment capacity bar, active leave reductions, and quick project switching.

3. **Availability & Leaves (`AvailabilityMatrixView`)**
   - Tracks scheduled vacations, PTO, sick leave, parental leave, and sabbaticals across the 12-month timeline (collapsed by default for quick scanning).
   - Automatically calculates each person's **effective monthly capacity** (`Base Capacity − Leave Impact`) and flags months where project bookings exceed reduced availability.

4. **Bench (`BenchMatrixView`)**
   - Highlights unallocated working capacity (`Effective Capacity − Booked Projects`) for every team member each month.
   - Includes a quick capacity filter (e.g., `≥ 10%`, `≥ 20%`, `≥ 50%`, or `100% free`) so resource managers can immediately find available staff and assign them to new projects with one click.

---

## Key Features

- **Streamlined Header Controls**:
  - **Planning Year Dropdown**: Switch between active planning years (`2025`, `2026`, `2027`, etc.) or open **+ Manage Years...** directly from the top year selector dropdown.
  - **Consolidated `+ Add` Menu**: Quickly add **+ Time Off**, **+ Person**, or **+ Project** from a single unified dropdown button alongside **Assign** and **Import / Export**.
- **Default A → Z Alphabetical Sorting**:
  - Defaults to **`A → Z`** sorting across all views (`Last Name: A → Z` for people and `Clients: A → Z` for clients & projects).
  - One-click **`A–Z` / `Z–A`** sort toggles in the sticky table headers and toolbar, plus dropdown options for `First Name` or `Original Order`.
- **Person-Grouped Overtime Alerts Drawer**:
  - Real-time conflict detection groups all over-allocated months for a team member into a single unified person card.
  - Includes both per-month **Auto-Cap** buttons and a one-click **Auto-Cap All Months** action per person.
- **Interactive Cell Popover & Batch Assignment**: Adjust allocations via slider or presets (`0%`, `25%`, `50%`, `75%`, `100%`) and apply changes to a single month, the remainder of the year, or all 12 months.
- **Inline Comments & Staffing Notes**: Add and edit inline comments directly between names and monthly columns for people, projects, assignments, and leaves.
- **Comprehensive Import, Export & Pre-Built CSV Templates**:
  - **Tab-Specific & All-Tabs CSV Export / Import**: Export or import `.csv` spreadsheets for `By Clients & Projects`, `By People`, `Availability & Leaves`, `Bench`, or all views.
  - **Downloadable Empty/Example CSV Templates**: Download ready-to-fill `.csv` templates directly from the Import modal.
  - **Full JSON Backup & Standalone HTML App**: Export the entire workspace state to `.json` or bundle the app into a portable single-file `.html` application.
- **Local-First Persistence & Privacy**: All workspace data is automatically persisted in browser `localStorage` (`allocat_resource_planner_v3`) with instant updates and zero external database dependencies.
- **Dark & Light Mode**: Defaults to **Dark Mode**, with a balanced soft-gray **Light Mode** toggle in the header.
