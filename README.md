# AlloCat — Resource & Capacity Planner

**AlloCat** is an interactive annual resource allocation and capacity planning application designed for engineering, product, design, and delivery teams. It provides a unified 12-month matrix workspace to plan team staffing across clients and deliverable projects, track time off and leaves, identify available bench capacity, and prevent overtime conflicts in real time.

**Live Application:** [https://ictismylife-dev.github.io/AlloCat/](https://ictismylife-dev.github.io/AlloCat/)

---

## Core Views & Perspectives

AlloCat lets you inspect and edit your organization's staffing plan from four synchronized perspectives:

1. **By People (`PeopleMatrixView`)**
   - Displays every team member alongside their annual average utilization and monthly capacity totals (`Jan` – `Dec`).
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

- **Real-Time Overtime & Conflict Detection**: Automatically flags over-allocated person-months and provides a dedicated **Overtime Alerts Drawer** with one-click **Auto-Cap** balancing.
- **Interactive Cell Popover & Batch Assignment**: Adjust allocations via slider or presets (`0%`, `25%`, `50%`, `75%`, `100%`) and apply changes to a single month, the remainder of the year, or all 12 months.
- **Inline Comments & Staffing Notes**: Add and edit inline comments directly between names and monthly columns for people, projects, assignments, and leaves.
- **Multi-Year & Department Management**:
  - Add, switch, or remove planning years (`2025`, `2026`, `2027`, etc.) on the fly.
  - Create, rename, or remove departments with automatic updates across all team members.
- **Search & Status Filtering**: Filter the matrix instantaneously by keyword (person, role, project, client, or comment), department, or utilization status (*All*, *Overbooked*, *Balanced 75–100%*, *Available <75%*).
- **Full Data Import, Export & Standalone Browser App**:
  - **Full JSON Backup & Restore**: Export the entire workspace state to a `.json` file and import it anytime.
  - **CSV Spreadsheet Export**: Export annual allocations and staffing notes to `.csv` for Excel or Google Sheets.
  - **Standalone Single-File HTML Download**: Bundle the application and current workspace data into a single portable `.html` file that runs offline in any browser.
- **Light & Dark Mode**: Built-in theme toggle optimized for high-density data readability.
