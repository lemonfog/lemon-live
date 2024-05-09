export const useCookie  = {
  getItem: function (key:string) {
    return (
      decodeURIComponent(
        document.cookie.replace(
          new RegExp(
            "(?:(?:^|.*;)\\s*" +
              encodeURIComponent(key).replace(/[-.+*]/g, "\\$&") +
              "\\s*\\=\\s*([^;]*).*$)|^.*$",
          ),
          "$1",
        ),
      ) || null
    );
  },
  setItem: function (key: string  , value: string | number | boolean, end: string | number | Date, path: string, domain: string, secure?: any) {
    if (!key || /^(?:expires|max\-age|path|domain|secure)$/i.test(key)) {
      return false;
    }
    var sExpires = "";
    if (end) {
      switch (end.constructor) {
        case Number:
          sExpires =
            end === Infinity
              ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT"
              : "; max-age=" + end;
          break;
        case String:
          sExpires = "; expires=" + end;
          break;
        case Date:
          sExpires = "; expires=" + (end as Date).toUTCString();
          break;
      }
    }

    document.cookie =
      encodeURIComponent(key) +
      "=" +
      encodeURIComponent(value) +
      sExpires +
      (domain ? "; domain=" + domain : "") +
      (path ? "; path=" + path : "") +
      (secure ? "; secure" : ""); 
    return true;
  },
  removeItem: function (key: string | number | boolean, path: string, domain: string) {
    if (!key || !this.hasItem(key)) {
      return false;
    }
    document.cookie =
      encodeURIComponent(key) +
      "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" +
      (domain ? "; domain=" + domain : "") +
      (path ? "; path=" + path : "");
    return true;
  },
  hasItem: function (key: string | number | boolean) {
    return new RegExp(
      "(?:^|;\\s*)" +
        encodeURIComponent(key).replace(/[-.+*]/g, "\\$&") +
        "\\s*\\=",
    ).test(document.cookie);
  },
  keys: /* optional method: you can safely remove it! */ function () {
    var aKeys = document.cookie
      .replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "")
      .split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
      aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
    }
    return aKeys;
  },
}; 