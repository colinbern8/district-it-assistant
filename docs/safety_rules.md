# Safety rules and technician review checklist

**Status: DRAFT.** Every workflow and the shared Powerwash procedure are marked
`"review_status": "draft"` and show a "Draft" banner in the app. A district
technician must review and approve them before real deployment.

Scope: Chromebook troubleshooting for students only.

## 1. Stop immediately

| Situation | Outcome | Student is told |
|---|---|---|
| Swollen/bulging battery, overheating, smoke, burning smell | `ESCALATE_SAFETY` | Stop using it and don't charge it. Don't touch it if smoking or too hot; move away. Tell a teacher or school staff right away (an adult, if at home). Staff will say what to do next. |
| Physical damage (cracks, liquid, broken hinge, missing keys, damaged charger or port) | `ESCALATE_DAMAGE` | Stop troubleshooting. Don't try to fix it. Take the Chromebook and charger to the school office. A technician handles the damage report. |
| Lost, stolen, or missing Chromebook or charger | `ESCALATE` / `/damaged` page | Go to the school office. |
| Someone else may know the password; account locked; suspicious activity | `ESCALATE` | Go to the school office. |
| "OS verification is off", "ChromeOS is missing or damaged", device disabled | `ESCALATE` | Do NOT press any keys. Go to the school office. |

A **"My Chromebook is damaged"** button is on every step of every workflow and
stops the session immediately. After a damage or safety outcome there is no
Back or Start over button.

## 2. The assistant never

- Creates repair tickets, authorizes or mentions loaners, or gives physical repair steps.
  Damage reports are handled by the technician through the existing GoGuardian process.
- Recommends Developer Mode, ChromeOS recovery, or bypassing device management,
  enrollment, content filtering, or school-controlled settings.
- Asks for passwords, names, asset tags, or any student information. The app has no text inputs.

## 3. Order of steps

Safety/damage check → settings → close the app → restart → hardware reset
(power workflows only) → Powerwash (last resort, 3 workflows only) → technician.

## 4. Hardware reset vs. Powerwash

| | Hardware reset | Powerwash |
|---|---|---|
| What it does | Restarts the hardware (Refresh + Power) | Erases the Chromebook to factory settings |
| Account | Stays | Removed; must sign in again |
| Local files | Usually kept; Downloads *might* be deleted | All local data erased |
| Afterwards | Sign in as usual | Needs Wi-Fi + school credentials; may re-enroll |
| UI warning | Yellow "Before you start" | Red "Warning, this erases data" |
| Used in | `chromebook_frozen`, `chromebook_wont_turn_on` | `chromebook_frozen`, `website_or_app_problem`, `chromebook_running_slow` |

**Powerwash is not offered** where it can't help or could lock the student out:
won't turn on, not charging (hardware), no sound and camera/mic (likely
hardware or policy), and sign-in problems (needs a working sign-in afterwards).
Wi-Fi workflows are deferred until the district Wi-Fi process is documented.

Before a Powerwash, students must confirm, in order: they want to continue,
their files are in Google Drive, and they have Wi-Fi plus their school email
and password. Any "No" goes to a technician.

## 5. Automated checks (`npm test`)

- Every power workflow starts with a safety check (→ `ESCALATE_SAFETY`) followed by a damage check (→ `ESCALATE_DAMAGE`).
- No workflow starts with a Powerwash step.
- Only the three workflows above can reach Powerwash.
- The Powerwash procedure is still `draft` and its run step has a `data_loss` warning.
- Every workflow uses known categories, outcomes, and warning levels, with no broken links, unreachable steps, or loops.

## 6. Technician review checklist

Please verify against the district's Chromebook models and admin settings:

- [ ] **Powerwash** (`frontend/data/shared/powerwash.json`): Is Powerwash allowed by policy on student devices? Is Ctrl + Alt + Shift + R → Restart → Powerwash correct? What do students see during re-enrollment?
- [ ] **Hardware reset**: Is Refresh + Power correct for all district models (tablets/convertibles may differ)?
- [ ] **Battery safety wording** (`SafetyView`): matches district/building safety guidance?
- [ ] **Camera/microphone permissions**: can students change site permissions, or are they policy-controlled?
- [ ] **Key names and screen locations** (Search + Esc, Alt + Search, Launcher, Quick Settings) match current ChromeOS on district devices.
- [ ] **Time estimates** in each workflow are realistic.
- [ ] Each workflow: set `"review_status": "approved"` only after review.
