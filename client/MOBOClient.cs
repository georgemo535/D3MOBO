using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

public class MOBOClient : MonoBehaviour
{
    // Start is called before the first frame update
    void Start()
    {

    }

    // Update is called once per frame
    void Update()
    {
        
    }

    public void SendPerformanceResult(List<float> designParams, List<float> objs, bool formal)
    {
        // TODO parse and inject into payload

        string payload = "{ \"design_params\": [0.00,0.00,0.00,0.00,0.25], \"objectives\" : [-0.123,-1.456], \"participant_id\":1, \"formal_eval\":1 }";
        StartCoroutine(Post("http://127.0.0.1:8080/cgi/web_service.py", payload));
    }

    IEnumerator Post(string url, string postData)
    {
        UnityWebRequest www = UnityWebRequest.Post(url, postData);
        byte[] bodyRaw = Encoding.UTF8.GetBytes(postData);
        www.uploadHandler = (UploadHandler)new UploadHandlerRaw(bodyRaw);
        www.downloadHandler = (DownloadHandler)new DownloadHandlerBuffer();
        www.SetRequestHeader("Content-Type", "application/json");
        www.SetRequestHeader("Accept-Encoding", "gzip, deflate");
    
        yield return www.SendWebRequest();

        if (www.isNetworkError || www.isHttpError)
        {
            Debug.Log(www.error);
        }
        else
        {
            Debug.Log(www.downloadHandler.text);
            Debug.Log("Form upload complete!");
        }
    }
}
