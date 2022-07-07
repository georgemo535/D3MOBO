using UnityEngine;
using UnityEngine.Networking;
using System;
using System.IO;
using System.Net;
using System.Threading;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

public class UnityHttpListener : MonoBehaviour
{
    private HttpListener listener;
    private Thread listenerThread;

    void Start()
    {
        listener = new HttpListener();
        listener.Prefixes.Add("http://localhost:4444/");
        listener.Prefixes.Add("http://127.0.0.1:4444/");
        listener.AuthenticationSchemes = AuthenticationSchemes.Anonymous;
        listener.Start();

        listenerThread = new Thread(startListener);
        listenerThread.Start();
        Debug.Log("Server Started");
    }

    void Update()
    {
    }

    private void startListener()
    {
        while (true)
        {
            var result = listener.BeginGetContext(ListenerCallback, listener);
            result.AsyncWaitHandle.WaitOne();
        }
    }

    private void ListenerCallback(IAsyncResult result)
    {
        var context = listener.EndGetContext(result);

        //Debug.Log("Method: " + context.Request.HttpMethod);
        //Debug.Log("LocalUrl: " + context.Request.Url.LocalPath);

        //if (context.Request.QueryString.AllKeys.Length > 0)
        //{
        //    foreach (var key in context.Request.QueryString.AllKeys)
        //    {
        //        Debug.Log("Key: " + key + ", Value: " + context.Request.QueryString.GetValues(key)[0]);
        //    }
        //}

        if (context.Request.HttpMethod == "POST")
        {
            //Thread.Sleep(1000);
            var data_text = new StreamReader(context.Request.InputStream,context.Request.ContentEncoding).ReadToEnd();
            // Debug.Log(data_text);
            HandleRequest(data_text);
        }

        context.Response.Close();
    }

    private void HandleRequest(string data)
    {
        // Debug.Log("HandleRequest: " + data);

        //"new_design_params": [0.0, 0.0, 0.0, 0.0, 0.25]
        string[] dataSplit = data.Split(':');
        string requestType = dataSplit[0].Trim(new Char[] { ' ', '{' });
        List<char> charsToRemove = new List<char>() { ' ', '[', ']', '{', '}' };
        
        string valuesStr = Regex.Replace(dataSplit[1], @"[ ""\[\]{}]", ""); //dataSplit[1].Filter(charsToRemove);
        //string valuesStr = dataSplit[1].Trim(new Char[] { ' ', '[', ']' });
        List<float> values = valuesStr.Split(',').Select(float.Parse).ToList();

        Debug.Log("Request type: " + requestType);
        string valuesParsed = "";
        foreach (float val in values)
        {
            valuesParsed += " " + val;
        }
        Debug.Log("Values: " + valuesParsed);
    }

}