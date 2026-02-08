{{- define "merged.postgres" -}}
{{- $pg := .Values.postgres | default dict -}}
{{- $globalPg := .Values.global.postgres | default dict -}}
{{- $merged := merge $globalPg $pg -}}
{{- toYaml $merged -}}
{{- end -}}
