{{/*
Expand the name of the chart.
*/}}
{{- define "extractable-management.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "extractable-management.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "extractable-management.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create service name as used by the service name label.
*/}}
{{- define "service.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "extractable-management.labels" -}}
helm.sh/chart: {{ include "extractable-management.chart" . }}
{{ include "extractable-management.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{ include "mclabels.labels" . }}
{{- end }}

{{/*
Returns the tag of the chart.
*/}}
{{- define "extractable-management.tag" -}}
{{- default .Chart.AppVersion .Values.image.tag }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "extractable-management.selectorLabels" -}}
app.kubernetes.io/name: {{ include "extractable-management.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{ include "mclabels.selectorLabels" . }}
{{- end }}

{{/*
Returns the environment from global if exists or from the chart's values, defaults to development
*/}}
{{- define "extractable-management.environment" -}}
{{- if .Values.global.environment }}
    {{- .Values.global.environment -}}
{{- else -}}
    {{- .Values.environment | default "development" -}}
{{- end -}}
{{- end -}}

{{/*
Returns the cloud provider name from global if exists or from the chart's values, defaults to minikube
*/}}
{{- define "extractable-management.cloudProviderFlavor" -}}
{{- if .Values.global.cloudProvider.flavor }}
    {{- .Values.global.cloudProvider.flavor -}}
{{- else if .Values.cloudProvider -}}
    {{- .Values.cloudProvider.flavor | default "minikube" -}}
{{- else -}}
    {{ "minikube" }}
{{- end -}}
{{- end -}}

{{/*
Returns the cloud provider docker registry url from global if exists or from the chart's values
*/}}
{{- define "extractable-management.cloudProviderDockerRegistryUrl" -}}
{{- if .Values.global.cloudProvider.dockerRegistryUrl }}
    {{- printf "%s/" .Values.global.cloudProvider.dockerRegistryUrl -}}
{{- else if .Values.cloudProvider.dockerRegistryUrl -}}
    {{- printf "%s/" .Values.cloudProvider.dockerRegistryUrl -}}
{{- else -}}
{{- end -}}
{{- end -}}

{{/*
Returns the cloud provider image pull secret name from global if exists or from the chart's values
*/}}
{{- define "extractable-management.cloudProviderImagePullSecretName" -}}
{{- if .Values.global.cloudProvider.imagePullSecretName }}
    {{- .Values.global.cloudProvider.imagePullSecretName -}}
{{- else if .Values.cloudProvider.imagePullSecretName -}}
    {{- .Values.cloudProvider.imagePullSecretName -}}
{{- end -}}
{{- end -}}

{{/*
Returns tracing enabled from global if exists or from chart's values
*/}}
{{- define "extractable-management.tracingEnabled" -}}
{{- if .Values.global.tracing.enabled }}
    {{- .Values.global.tracing.enabled -}}
{{- else -}}
    {{- .Values.env.tracing.enabled -}}
{{- end -}}
{{- end -}}

{{/*
Returns metrics enabled from global if exists or from chart's values
*/}}
{{- define "extractable-management.metricsEnabled" -}}
{{- if .Values.global.metrics.enabled }}
    {{- .Values.global.metrics.enabled -}}
{{- else -}}
    {{- .Values.env.metrics.enabled -}}
{{- end -}}
{{- end -}}

{{/*
Returns the tracing url from global if exists or from the chart's values
*/}}
{{- define "extractable-management.tracingUrl" -}}
{{- if .Values.global.tracing.url }}
    {{- .Values.global.tracing.url -}}
{{- else if .Values.cloudProvider -}}
    {{- .Values.env.tracing.url -}}
{{- end -}}
{{- end -}}

{{/*
Returns the tracing url from global if exists or from the chart's values
*/}}
{{- define "extractable-management.metricsUrl" -}}
{{- if .Values.global.metrics.url }}
    {{- .Values.global.metrics.url -}}
{{- else -}}
    {{- .Values.env.metrics.url -}}
{{- end -}}
{{- end -}}

{{/*
Generate OpenTelemetry trace configuration
*/}}
{{- define "extractable-management-nginx.otelTrace" -}}
{{- if eq .Values.nginx.opentelemetry.samplerMethod "AlwaysOn" -}}
otel_trace on;
{{- else if eq .Values.nginx.opentelemetry.samplerMethod "TraceIdRatioBased" -}}
otel_trace $ratio_sampler;
{{- else -}}
otel_trace off;
{{- end -}}
{{- end -}}
