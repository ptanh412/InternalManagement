package com.devteria.notification.dto.request;

import java.util.List;

public class MarkReadRequest {
    private List<String> ids;

    public List<String> getIds() {
        return ids;
    }

    public void setIds(List<String> ids) {
        this.ids = ids;
    }
}
