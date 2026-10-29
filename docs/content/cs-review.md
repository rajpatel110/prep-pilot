# CS starter review pack

Review-only proposal v1. All items are AI-assisted, human review pending, and not inserted or published. JSON is the authoritative field-value companion. All entries have companies: [], assetIds: [], reviewedAt: null. Leave optional blank fields omitted, not null, on creation. Do not paste this Markdown metadata into a learning body.

## cs-dbms-transaction-boundaries

| Admin field      | Proposed value                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| slug             | `cs-dbms-transaction-boundaries`                                                                        |
| title            | Understand an all-or-nothing transaction                                                                |
| subject          | `cs`                                                                                                    |
| topic            | `dbms`                                                                                                  |
| type             | `resource`                                                                                              |
| difficulty       | `easy`                                                                                                  |
| estimatedMinutes | 15                                                                                                      |
| tags             | `starter-v1`, `foundation`                                                                              |
| companies        | `[]` — shared foundation, no supported company claim                                                    |
| assetIds         | `[]` — files deferred                                                                                   |
| reviewedAt       | `null` — human review pending                                                                           |
| externalUrl      | [Inspected reference/practice page](https://www.postgresql.org/docs/current/tutorial-transactions.html) |

**source:** Original PrepPilot learning note with reference: PostgreSQL Global Development Group, tutorial Transactions (https://www.postgresql.org/docs/current/tutorial-transactions.html).

**attribution:** AI-assisted original note and exercises; PostgreSQL Global Development Group, tutorial Transactions is the linked reference, not a source of copied exercises. No endorsement. Link inspected by agent on 2026-10-25; human content review pending.

### body

## Goal

Explain transaction boundaries without confusing them with one SQL statement.

Read the linked PostgreSQL introduction to transactions. A transaction groups changes into a unit; COMMIT accepts it and ROLLBACK abandons uncommitted changes. Visibility/isolation details depend on the database and isolation level, so do not infer a universal concurrency guarantee from atomicity alone.

## Original exercise

An inventory count is 12 and reserved count is 0. A transaction intends to reduce inventory by 3 and increase reserved by 3. If an application error occurs after the first update and the transaction is rolled back, the counts remain 12 and 0. After a successful commit of both updates they become 9 and 3.

## Self-check

Explain why two independent autocommitted updates could leave inconsistent counts if the application fails between them. Read the reference, trace the original example and explain rollback in your own words; the proposed study time includes that activity, not a required waiting period.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## cs-dbms-candidate-and-foreign-keys

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `cs-dbms-candidate-and-foreign-keys`                 |
| title            | Identify keys from declared data rules               |
| subject          | `cs`                                                 |
| topic            | `dbms`                                               |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

A Students relation has studentId, email and departmentId. Every studentId and every email is unique and non-null; many students may share a departmentId. A Departments relation has a unique non-null departmentId. Under these stated rules, name the minimal candidate keys for Students, choose one primary key, and identify a possible foreign key.

### explanation — hide until the learner requests it

{studentId} and {email} are each minimal candidate keys. Choose studentId as the primary key; email remains an alternate candidate key with a uniqueness constraint. Students.departmentId can reference Departments.departmentId as a foreign key, with explicit nullability decided separately. departmentId is not a candidate key for Students because duplicates are allowed. A candidate key is minimal, so the pair {studentId,email} is a superkey but not a minimal candidate key.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## cs-dbms-grouping-filter

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `cs-dbms-grouping-filter`                            |
| title            | Distinguish row filtering from grouped filtering     |
| subject          | `cs`                                                 |
| topic            | `dbms`                                               |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Sales rows are (region,amount): ('East',40),('East',70),('West',90),('West',20),('North',30). All amounts are non-null integers. Query: SELECT region, SUM(amount) AS total FROM Sales WHERE amount >= 40 GROUP BY region HAVING SUM(amount) >= 100. What rows are returned? Output order is unspecified. Explain WHERE versus HAVING.

### explanation — hide until the learner requests it

WHERE retains East 40, East 70 and West 90. Group totals become East 110 and West 90. HAVING retains only ('East',110). North disappears before grouping because its row fails WHERE. WHERE filters individual input rows; HAVING filters groups after aggregation. The query has no ORDER BY, so row ordering is not promised.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## cs-dbms-third-normal-form

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `cs-dbms-third-normal-form`                          |
| title            | Decompose a transitive department dependency         |
| subject          | `cs`                                                 |
| topic            | `dbms`                                               |
| type             | `question`                                           |
| difficulty       | `medium`                                             |
| estimatedMinutes | 30                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Enrollment has columns studentId, studentName, departmentId, departmentName. Declared dependencies are studentId → studentName,departmentId and departmentId → departmentName; one department can contain many students. studentId is the sole candidate key. Explain the transitive dependency and give a lossless decomposition that avoids repeating a department name for each student. Assume one department per student.

### explanation — hide until the learner requests it

departmentName depends on studentId through departmentId, a non-key attribute. Decompose into Students(studentId,studentName,departmentId) and Departments(departmentId,departmentName), with their named IDs as keys and Students.departmentId referencing Departments.departmentId. The shared departmentId determines the entire Departments relation, supporting a lossless join under these dependencies. Updating one department name now changes one row rather than many. This is a dependency-based example, not a claim that every real schema must follow this exact design.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## cs-os-process-thread-boundaries

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `cs-os-process-thread-boundaries`                    |
| title            | Compare processes, threads and shared state          |
| subject          | `cs`                                                 |
| topic            | `operating_systems`                                  |
| type             | `resource`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot learning note, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### body

## Goal

Distinguish an execution context from an isolation boundary.

In a conventional operating-system model, a process has an address space and owned resources; threads in that process share its address space but have their own execution state, including registers and stack. Per-thread stacks are not security-isolated from other threads in the same address space. Separate processes can explicitly share memory, so isolation is not an absolute claim that sharing never happens.

## Exercise

Two threads both read shared counter 0, both compute 1, then both store 1. The final counter is 1 despite two intended increments. Identify the lost update and propose a mutex around the read-modify-write sequence or a suitable atomic increment. Making a second thread does not by itself make the operation atomic.

## Self-check

Explain why sharing data can be convenient but requires coordination. Draw per-thread stacks and a shared heap, trace the interleaving, then explain where synchronization belongs. Do not confuse a per-thread stack with protected memory.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## cs-os-round-robin-trace

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `cs-os-round-robin-trace`                            |
| title            | Trace round-robin completion and waiting time        |
| subject          | `cs`                                                 |
| topic            | `operating_systems`                                  |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Three CPU-only jobs A,B,C arrive at time 0 in that queue order. CPU bursts are 5,3,1 time units. Round-robin quantum is 2, context-switch cost is zero, and there are no later arrivals or I/O. Give the execution intervals and completion times. Compute waiting time as turnaround minus burst.

### explanation — hide until the learner requests it

Intervals: A [0,2), B [2,4), C [4,5), A [5,7), B [7,8), A [8,9). Completion times A=9, B=8, C=5. Since arrival is 0, turnaround equals completion. Waiting times are A:9-5=4, B:8-3=5, C:5-1=4; average waiting is 13/3 time units. Total CPU time 9 equals the burst sum. Do not mistake response time (first start) for total waiting.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## cs-os-two-lock-deadlock

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `cs-os-two-lock-deadlock`                            |
| title            | Identify a deadlock and an ordering prevention rule  |
| subject          | `cs`                                                 |
| topic            | `operating_systems`                                  |
| type             | `question`                                           |
| difficulty       | `medium`                                             |
| estimatedMinutes | 30                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Thread T1 holds non-reentrant exclusive lock A and waits indefinitely for B. Thread T2 holds B and waits indefinitely for A. Neither releases its held lock before acquiring the other, and there are no timeouts or lock preemption. Explain why progress stops and give one prevention rule that preserves mutual exclusion.

### explanation — hide until the learner requests it

Each thread waits for a lock held by the other, creating a circular wait. Mutual exclusion, hold-and-wait, no preemption and circular wait are all present under the assumptions. Require every thread needing both locks to acquire A before B; release in reverse order. A thread holding B then waiting for A is no longer permitted, breaking this cycle. A global order prevents this lock-order deadlock only when every participating acquisition follows it; it does not eliminate all possible blocking or guarantee fairness.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## cs-os-page-offset

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `cs-os-page-offset`                                  |
| title            | Split a logical address into page and offset         |
| subject          | `cs`                                                 |
| topic            | `operating_systems`                                  |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Pages contain 1024 bytes and logical addresses are nonnegative byte offsets starting at zero. For logical address 2500, find page number and offset. The page table maps that page to physical frame 7; give the physical address. Assume the mapping is present and permissions allow access.

### explanation — hide until the learner requests it

2500=2×1024+452, so page number is 2 and offset 452. Frame 7 starts at 7×1024=7168; the physical address is 7168+452=7620. Offset is unchanged by page translation and is between 0 and 1023. An absent mapping would require fault handling rather than blindly forming an address, but presence is guaranteed here.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## cs-net-http-request-response

| Admin field      | Proposed value                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| slug             | `cs-net-http-request-response`                                                                         |
| title            | Read HTTP as messages, not a persistent login guarantee                                                |
| subject          | `cs`                                                                                                   |
| topic            | `networking`                                                                                           |
| type             | `resource`                                                                                             |
| difficulty       | `easy`                                                                                                 |
| estimatedMinutes | 15                                                                                                     |
| tags             | `starter-v1`, `foundation`                                                                             |
| companies        | `[]` — shared foundation, no supported company claim                                                   |
| assetIds         | `[]` — files deferred                                                                                  |
| reviewedAt       | `null` — human review pending                                                                          |
| externalUrl      | [Inspected reference/practice page](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview) |

**source:** Original PrepPilot learning note with reference: MDN Web Docs, Overview of HTTP (https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview).

**attribution:** AI-assisted original note and exercises; MDN Web Docs, Overview of HTTP is the linked reference, not a source of copied exercises. No endorsement. Link inspected by agent on 2026-10-25; human content review pending.

### body

## Goal

Recognize request/response messages and distinguish transport from application state.

Read the linked MDN HTTP overview. A request names a method and target and may carry headers/body; a response supplies a status and headers and may carry a body. HTTP's stateless semantics do not prevent an application from relating requests using cookies and server-side session records.

## Exercise

Sketch GET /notes followed by a 200 response and a short text body. Then explain a 404 response: the requested resource was not found, not necessarily that the network is offline. Explain why a cookie alone should not be assumed to prove current server-side permission.

## Boundary

HTTPS adds transport protection; it does not make every application action authorized. Read the relevant message/state sections, sketch the exchange and explain state in your own words; do not stretch the activity merely to fill a time allowance. Reading this note does not record an attempt or complete a task.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## cs-net-ipv4-subnet

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `cs-net-ipv4-subnet`                                 |
| title            | Calculate a conventional IPv4 /27 subnet             |
| subject          | `cs`                                                 |
| topic            | `networking`                                         |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

For host 192.168.10.77/27, give subnet mask, network address, broadcast address and conventional usable host range/count. Assume ordinary multi-access IPv4 subnet rules, not /31 point-to-point exceptions.

### explanation — hide until the learner requests it

A /27 mask is 255.255.255.224 with blocks of 32 addresses in the last octet. 77 is in the 64–95 block. Network is 192.168.10.64, broadcast 192.168.10.95, usable hosts 192.168.10.65 through 192.168.10.94: 30 hosts. The block contains 32 addresses; conventional network/broadcast reservations remove two. The mask comes from 27 network bits, not the decimal size of the host address.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## cs-net-transport-tradeoffs

| Admin field      | Proposed value                                                  |
| ---------------- | --------------------------------------------------------------- |
| slug             | `cs-net-transport-tradeoffs`                                    |
| title            | Choose transport properties without claiming guaranteed latency |
| subject          | `cs`                                                            |
| topic            | `networking`                                                    |
| type             | `question`                                                      |
| difficulty       | `medium`                                                        |
| estimatedMinutes | 30                                                              |
| tags             | `starter-v1`, `foundation`                                      |
| companies        | `[]` — shared foundation, no supported company claim            |
| assetIds         | `[]` — files deferred                                           |
| reviewedAt       | `null` — human review pending                                   |
| externalUrl      | Omitted; self-contained original material                       |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

A file-transfer application needs an ordered reliable byte stream; a live sensor app sends independent freshness-sensitive measurements and can tolerate some loss. Compare TCP and UDP as transport primitives. Does choosing UDP guarantee lower latency or congestion safety? What application work may remain?

### explanation — hide until the learner requests it

TCP provides an ordered byte stream with retransmission/flow control and congestion control; it does not preserve application message boundaries, so file framing and integrity/application errors still need handling. UDP provides datagrams without built-in delivery/order guarantees. It can suit independent measurements, but loss handling, pacing/congestion considerations, authentication and any reliability needed must be designed at an appropriate layer. UDP does not guarantee lower end-to-end latency. Protocols built over UDP can add reliability; this comparison concerns bare transport services, not every UDP-based protocol.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## cs-net-dns-versus-https

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `cs-net-dns-versus-https`                            |
| title            | Separate name resolution from encrypted HTTP         |
| subject          | `cs`                                                 |
| topic            | `networking`                                         |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

In a simplified fresh HTTPS connection to a site by hostname, distinguish DNS resolution, transport setup, TLS and the HTTP exchange. Does receiving an IP address prove the website is authentic? Assume ordinary HTTPS over TCP with no reused connections; other transports and cached results are outside this trace.

### explanation — hide until the learner requests it

DNS resolves a hostname to addressing information; it does not itself establish the site's HTTPS identity. The client opens a TCP connection, performs TLS negotiation including appropriate certificate/hostname validation, then exchanges HTTP within the protected channel. An IP result alone is not proof of authenticity or permission. DNS may be cached in real clients and HTTPS can use other transports, so this ordered trace is tied to the stated simplified setup.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## cs-oop-composition-contracts

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `cs-oop-composition-contracts`                       |
| title            | Model an object by its behavior and collaborators    |
| subject          | `cs`                                                 |
| topic            | `oop`                                                |
| type             | `resource`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot learning note, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### body

## Goal

Use encapsulation and composition without treating inheritance as mandatory.

A StudyTimer owns elapsed minutes and exposes start, stop and readElapsed operations. An application-facing StudySession can use a timer object as a collaborator instead of inheriting its implementation. Encapsulation keeps callers from arbitrarily changing internal elapsed state; a clear interface states allowed operations and errors.

## Exercise

Sketch a Timer interface and two implementations: one reading a real clock and one controlled by a test. Inject the interface into StudySession. Explain why tests can advance the fake without sleeping, and why the fake must still honor the same observable contract.

## Self-check

Composition means using a collaborator; inheritance means specializing a type/implementation relationship. Neither automatically guarantees substitutability. Draw the collaborators, sketch the interface and check the fake's observable contract. The time label is a provisional budget, not an instruction to spend five minutes on each small step.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## cs-oop-runtime-dispatch

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `cs-oop-runtime-dispatch`                            |
| title            | Trace overriding through a base-type reference       |
| subject          | `cs`                                                 |
| topic            | `oop`                                                |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Assume a Java-like class language with virtual instance methods. Base class Notice has message() returning 'notice'. Reminder extends Notice and overrides message() to return 'reminder'. A variable declared as Notice refers to new Reminder(). What does calling message() return? Explain runtime overriding versus compile-time overload selection. Ignore static methods and fields.

### explanation — hide until the learner requests it

It returns 'reminder': virtual instance dispatch uses the runtime object type to choose the overriding implementation. The variable's declared type controls which members are accessible at compile time, but does not replace virtual dispatch with the base body. Overloading selects among method signatures using the language's compile-time rules; it is not the same as overriding one inherited signature. The assumptions matter because static methods and nonvirtual languages behave differently.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## cs-oop-substitution-preconditions

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `cs-oop-substitution-preconditions`                  |
| title            | Check whether a subtype strengthens a precondition   |
| subject          | `cs`                                                 |
| topic            | `oop`                                                |
| type             | `question`                                           |
| difficulty       | `medium`                                             |
| estimatedMinutes | 30                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

A FileReader contract promises read(path) accepts any readable local file and returns its bytes. A proposed TextOnlyReader subtype rejects every readable file not ending in '.txt', even when the bytes could otherwise be read. Is it substitutable under the stated contract? Suggest a design that keeps the restriction explicit.

### explanation — hide until the learner requests it

It is not substitutable for that broad contract: it adds a stronger filename precondition, so a caller using a readable '.bin' file can fail where FileReader promised success. Prefer a separate text-specific interface, or compose a FileReader with an explicitly requested text-validation step. Do not weaken the public contract silently just to fit the subtype. This conclusion follows from the specified acceptance promise, not from a blanket rule that subclasses may never validate inputs.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.
