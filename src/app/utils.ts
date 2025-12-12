export function manageHttpResponse(response: Response) {
  if (!response.ok) {
    throw response;
  }
}
