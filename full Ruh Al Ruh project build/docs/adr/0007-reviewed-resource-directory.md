# Reviewed-only resource directory

Status: accepted

The resource directory is a model and API over entries that are filtered by language and jurisdiction. Every entry must carry a named source and review date. The approved first launch is the United States in English and Spanish, using 988 Lifeline, Crisis Text Line and the Veterans Crisis Line from their official sites. All other language and jurisdiction combinations return a localised unavailability notice.

Alternatives considered: shipping a global hotline list from general knowledge (rejected because contact details vary by jurisdiction and become stale), and generating a country-specific number from the member's language (rejected because language is not jurisdiction). Consequences: real resource content cannot be added for another jurisdiction until its sources, languages and review date are supplied; no code path invents a number or service; and the support offer remains useful because it explains when no reviewed local service is available.
