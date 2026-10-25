# Owner workspace design reference

Use the existing PrepPilot design system, not a redesign: warm ivory #F7F5EF,
forest #245443, charcoal #202823, muted #58635C, white surfaces and #DCE3DB borders.
Retain existing application typography and shared native library-dialog styles.

Inspected Stitch project 7439735129249105516: desktop screen
920938cba3284c91bae1cccca16948a3 and mobile screen
d07f434fe6b94d8a9be3b5e153052d5a (mobile composition inside a desktop-sized export).
Both HTML and screenshots were inspected. Reuse the protected owner row,
administrator list, exact-email lookup, eligibility results, password confirmation
and final grant/remove confirmation. Desktop rows stack into mobile cards.

Do not implement simulator controls, fictional identities/counts, activity-log or
service-status destinations, department assignments, ownership transfer, invitation
or deletion controls. Security requirements override illustrative behaviour.
Use restrained motion, visible focus, 44px targets, wrapping email text and native
modal Escape/focus restoration. No new font, animation or icon dependency is needed.
