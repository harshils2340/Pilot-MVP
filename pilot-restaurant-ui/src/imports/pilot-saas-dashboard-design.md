Design a clean, simple SaaS dashboard UI for a product called Pilot, a compliance assistant for restaurants that organizes documents, extracts compliance data, and prepares restaurants for inspections.

The UI should feel simple, calm, and operational, similar to tools like Stripe Dashboard, Notion, and Linear. Avoid clutter. Focus on clear workflows and visual organization.

Use a light theme, soft grays, white cards, and subtle blue accents.

Create the following screens.

1. Document Upload & Processing Screen

Purpose: show how restaurants upload documents and Pilot extracts useful information.

Layout:

Left sidebar navigation with sections:

Dashboard

Documents

Compliance Calendar

Inspections

Tasks

Compliance Assistant

Main panel:

Top section:
A large Upload Document area with drag-and-drop.

Example uploaded files shown as cards:

Health Permit.pdf

Pest Control Report.pdf

Hood Cleaning Invoice.pdf

Inspection Report.pdf

Food Safety Certificate.pdf

When a document is uploaded, show an AI extraction panel on the right that displays structured metadata.

Example extracted fields:

Document Type: Health Permit
Issuer: Santa Clara County
Issue Date: Jan 5 2026
Expiry Date: Jan 5 2027

Document Type: Pest Control Service
Service Date: Feb 10 2026
Next Service Due: Mar 10 2026

Show a visual label:
"Pilot extracted key compliance data from this document."

2. Organized Document Vault

Purpose: show how all documents are stored and searchable.

Layout:

Table or card grid showing structured documents.

Columns:

Document
Type
Vendor / Issuer
Issue Date
Expiry Date
Status

Example rows:

Health Permit | License | Santa Clara County | Jan 2026 | Jan 2027 | Active
Pest Control Service | Maintenance | Terminix | Feb 2026 | Mar 2026 | Due Soon
Inspection Report | Inspection | Santa Clara County | Feb 2026 | — | Completed

Top of screen includes natural language search bar.

Example queries shown as suggestions:

"inspection reports from 2026"
"pest control invoices"
"documents expiring soon"

3. Compliance Calendar

Purpose: show how extracted data becomes reminders and tasks.

Calendar or timeline view with upcoming compliance events.

Example events:

Mar 10 – Pest Control Service Due
Apr 5 – Food Safety Certificate Renewal
May 12 – Hood Cleaning Required

Each event expands into a task card:

Task
Owner
Status
Related Document

4. Inspection Analysis Screen

Purpose: visualize how Pilot converts an inspection report into structured feedback.

Top section:

Inspection summary card

Restaurant Score: 81
Grade: B
Inspection Date: Feb 24 2026

Below that:

Violation Breakdown

Major Violations

Improper food temperature control (4 points)

Minor Violations

Handwashing station supplies missing (2 points)

Non-food contact surfaces dirty (2 points)

Right panel:

"Pilot Recommendations"

Suggested fixes before next inspection.

Example checklist:

Verify hot food holding temperature daily

Restock soap and paper towels at handwashing station

Clean cookline surfaces nightly

5. Inspection Readiness Checklist

Purpose: show a simple checklist owners can follow before inspectors arrive.

Checklist UI with toggles.

Example items:

Food temperatures logged today
Handwashing station stocked
Pest control report uploaded
Sanitizer concentration checked
Inspection report available

Status indicator at top:

Inspection Readiness: Good

6. Compliance Assistant Chatbot

Purpose: a contextual AI assistant that answers compliance questions.

Right side chat interface.

Example messages:

User:
"What permits do I need for my restaurant in San Jose?"

Assistant:
Based on Santa Clara County requirements for your location, you need:

Health Permit

Food Safety Manager Certification

Grease Interceptor Maintenance

Annual Hood Cleaning

User:
"When does my pest control service expire?"

Assistant:
Your last pest control service was Feb 10 2026.
Next service recommended: Mar 10 2026.

Overall Design Style

Clean SaaS dashboard layout

Minimal colors

Card based UI

Clear hierarchy

Large readable typography

Focus on simplicity and clarity

No unnecessary complexity

The UI should visually communicate the workflow:

Upload documents → extract compliance data → organize documents → generate tasks → analyze inspections → prepare for next inspection → ask compliance questions.

Make the product feel simple, trustworthy, and easy for a restaurant owner to understand.