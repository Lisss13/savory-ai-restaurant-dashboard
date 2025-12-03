if (Array.isArray(responseData)) {
rawSessions = responseData;
} else if (Array.isArray(responseData?.data)) {
rawSessions = responseData.data;
} else if (Array.isArray(responseData?.data?.sessions)) {
rawSessions = responseData.data.sessions;
} else if (Array.isArray(responseData?.sessions)) {
rawSessions = responseData.sessions;
}
